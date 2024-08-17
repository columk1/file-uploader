import { NextFunction, Request, Response } from 'express'
import { getAllFilenames, getFolderTree, getPathSegments } from 'src/services/dirService'
import prisma from 'src/db/prismaClient'
import helpers from 'src/lib/utils/ejsHelpers'
import supabaseAdmin from 'src/db/supabaseAdminClient'
import { decode } from 'base64-arraybuffer'
import path from 'path'
import { Readable } from 'stream'

const getDashboard = async (req: Request, res: Response) => {
  const { sortCriteria } = req

  const files = await prisma.entity.findMany({
    where: { userId: req.user?.id, parentId: null },
    orderBy: sortCriteria,
  })

  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(req.user?.id, null)
  console.log({ folders })

  res.render('dashboard', {
    title: 'File Uploader',
    files,
    folders,
    id: null,
    parentId: null,
    sortQuery,
    helpers,
  })
}

// GET: /:entityId (Same view as Dashboard)
const getEntityById = async (req: Request, res: Response) => {
  const id = Number(req.params.entityId)
  if (!id) return res.redirect('/')

  const { sortCriteria } = req

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      childEntities: {
        orderBy: sortCriteria,
      },
    },
  })
  if (!entity) return res.status(404).send('Not found')

  const { name, type, childEntities: files, parentId } = entity
  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(req.user?.id, null)
  const pathSegments = await getPathSegments(id)

  res.render('dashboard', {
    title: 'File Uploader',
    id,
    name,
    type,
    files,
    parentId,
    pathSegments,
    folders,
    sortQuery,
    helpers,
  })
}

// POST: /new Create a new folder
const createFolder = async (req: Request, res: Response) => {
  {
    const id = req.user?.id
    if (!id) return res.status(500).send({ errors: [{ message: 'Unauthorized' }] }) // TODO:Check if necessary

    const parentId = Number(req.body.parentId) || null

    const newFolder = await prisma.entity.create({
      data: {
        type: 'FOLDER',
        name: req.body.name || Date.now().toString(),
        userId: id,
        parentId,
      },
    })
    res.redirect(`back`)
  }
}

// POST: /upload Upload a file
const uploadFile = async (req: Request, res: Response) => {
  {
    try {
      const id = req.user?.id
      const file = req.file
      if (!id) return res.status(500).send({ errors: [{ message: 'Unauthorized' }] })

      // req.file is the name of the user's file in the form, 'uploaded_file'
      if (!file) return res.status(400).send({ errors: [{ message: 'No file uploaded' }] })
      const { originalname, mimetype, size, buffer } = file
      const parentId = Number(req.body.parentId) || null

      const bucketName = 'files'
      const options = { contentType: mimetype }
      const filePath = `${id}/${originalname}`
      const fileBase64 = decode(buffer.toString('base64'))

      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, fileBase64, options)

      if (error) {
        console.log(error)
        if ('statusCode' in error && error.statusCode === '409') {
          console.log('Duplicate')
          return res.redirect(`/${path}?error=${error.message}`)
        }
      }

      // add to database using prisma
      const newFile = await prisma.entity.create({
        data: {
          type: 'FILE',
          name: originalname,
          mimeType: mimetype,
          size,
          userId: id,
          parentId,
        },
      })
      res.redirect('/' + parentId)
    } catch (error) {
      console.log(error)
    }
  }
}

// POST: /delete/:entityId
const deleteEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.entityId)
    const userId = req.user?.id

    if (!userId) return res.status(500).send({ errors: [{ message: 'Unauthorized' }] })

    const { entityId } = req.params
    const { type, parentId } = req.body

    if (entityId === 'null') throw new Error('Cannot delete root folder')

    // TODO: Clean up this section
    let filenames = []

    if (type === 'FOLDER') {
      filenames = await getAllFilenames(userId, id) // recursively get all filenames
    } else {
      filenames = await prisma.entity.findUnique({ where: { id } }).then((entity) => [entity?.name])
    }

    const deletedEntity = await prisma.entity.delete({
      where: {
        id,
      },
    })

    res.redirect(`/${parentId}`)

    // Continue to remove from storage
    filenames.forEach(async (filename) => {
      console.log({ filename })
      const { data, error } = await supabaseAdmin.storage
        .from('files')
        .remove([`${userId}/${filename}`])
      if (error) {
        console.log(error)
      }
    })
  } catch (err) {
    next(err)
  }
}

// GET: /download:entityId // TODO: Find out if params should be used here or not
const downloadFile = async (req: Request, res: Response) => {
  try {
    const fileName = req.query.name
    const mimetype = String(req.query.mimetype)
    const filePath = `${req.user?.id}/${fileName}`
    const { data } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 60, { download: true })

    res.redirect(data?.signedUrl || '/')

    // ? Stream to user instead of providing link to protect storage url (could be overkill)
    // const { data, error } = await supabaseAdmin.storage.from('files').download(filePath)
    // if (error) {
    //   console.log(error)
    // }
    // if (!data) {
    //   return res.status(500).json({ errors: [{ message: 'No readable stream' }] })
    // }
    // const buffer = await data.arrayBuffer()
    // const stream = Readable.from(Buffer.from(buffer))
    // res.setHeader('Content-Type', mimetype || 'application/octet-stream')
    // res.setHeader('Content-Disposition', `attachment; filename="${filePath.split('/').pop()}"`)
    // stream.pipe(res)
  } catch (err) {
    console.log(err)
  }
}

// GET: /share/file/:fileName // TODO: This could be better as entityId with a query
const shareFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName } = req.params
    const filePath = `${req.user?.id}/${fileName}`
    const { data } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7)

    if (!data) {
      return res.status(500).send({ errors: [{ message: 'Error fetching signed URL' }] })
    }
    res.json(data.signedUrl)
  } catch (err) {
    console.log(err)
    next(err)
  }
}

const shareFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.params)
    const id = Number(req.params.entityId)
    console.log({ id })

    const folders = await getFolderTree(req.user?.id, id)

    res.json({ publicUrl: `http:localhost:3000/public/${id}` })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /public/:entityId
const getPublicFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.entityId)
    if (!id) return res.redirect('/')
    // TODO: Check if id is in public folders table

    const { sortCriteria } = req

    const files = await prisma.entity.findMany({
      where: { userId: req.user?.id, parentId: id },
      orderBy: sortCriteria,
    })
    if (!files) return res.status(404).send('Not found')

    const folders = await getFolderTree(req.user?.id, id)
    const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})

    res.render('public-folder', {
      title: 'File Uploader',
      id,
      files,
      folders,
      helpers,
      parentId: null,
      sortQuery,
    })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

export {
  getDashboard,
  getEntityById,
  createFolder,
  uploadFile,
  deleteEntity,
  downloadFile,
  shareFile,
  shareFolder,
  getPublicFolder,
}
