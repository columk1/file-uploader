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

const getUploadUrl = async (req: Request, res: Response) => {
  const id = req.user?.id
  if (!id) return res.status(401).send({ errors: [{ message: 'Unauthorized' }] })

  console.log('Request body: ', req.body)
  const filename = req.body.filename
  const bucketName = 'files'
  const filePath = `${id}/${filename}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(filePath) // URL valid for 60 seconds
  if (error) {
    console.log('supabase error: ', error)
    return res.status(500).send({ errors: [{ message: error.message }] })
  }

  res.send({ signedUrl: data.signedUrl })
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

// GET: /download/:entityId // TODO: Find out if params should be used here or not
const downloadFile = async (req: Request, res: Response) => {
  try {
    const fileName = req.query.name
    const filePath = `${req.user?.id}/${fileName}`
    const { data } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 60, { download: true })

    if (data?.signedUrl) {
      res.redirect(data.signedUrl)
    } else {
      res.status(500).send({ errors: [{ message: 'Error fetching signed URL' }] })
    }
  } catch (err) {
    console.log(err)
  }
}

const downloadPublicFile = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.entityId)
    const { filename } = req.query

    const userId = await prisma.entity
      .findUnique({ where: { id } })
      .then((entity) => entity?.userId)

    const filePath = `${userId}/${filename}`
    const { data } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 60, { download: true })

    if (data?.signedUrl) {
      res.redirect(data.signedUrl)
    } else {
      res.status(500).send({ errors: [{ message: 'Error fetching signed URL' }] })
    }
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
    const userId = req.user?.id
    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 1000)

    const newSharedFolder = await prisma.sharedFolder.create({
      data: {
        userId,
        folderId: id,
        expiresAt,
      },
    })

    res.json({ publicUrl: `http:localhost:3000/public/${id}` })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /public/:entityId Or unique publicSessionId?
const getPublicFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.entityId)
    if (!id) return res.redirect('/')

    const { sortCriteria } = req

    const sharedFolder = await prisma.sharedFolder.findFirst({
      // where: { folderId: id },
      // include: { folder: true },
      where: {
        OR: [
          { folderId: id }, // Root folder match
          { folder: { childEntities: { some: { id } } } }, // Descendant folder match
        ],
      },
      include: {
        folder: true,
      },
    })
    if (!sharedFolder) {
      return res.status(404).send({ errors: [{ message: 'Not Found' }] })
    }

    if (new Date() > sharedFolder.expiresAt) {
      return res.status(410).send('This link has expired')
    }

    const userId = sharedFolder.userId
    const rootFolder = { id: sharedFolder.folderId, name: sharedFolder.folder.name }

    const files = await prisma.entity.findMany({
      where: { userId, parentId: rootFolder.id },
      orderBy: sortCriteria,
    })
    if (!files) return res.status(404).send('Not found')

    const folders = await getFolderTree(4, rootFolder.id)
    const pathSegments = await getPathSegments(rootFolder.id)
    const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})

    res.render('public-folder', {
      title: 'File Uploader',
      id,
      files,
      folders,
      helpers,
      pathSegments,
      sortQuery,
      rootFolder,
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
  getUploadUrl,
  uploadFile,
  deleteEntity,
  downloadFile,
  downloadPublicFile,
  shareFile,
  shareFolder,
  getPublicFolder,
}
