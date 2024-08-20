import { NextFunction, Request, Response } from 'express'
import { getAllFilenames, getFolderTree, getPathSegments } from 'src/services/dirService'
import prisma from 'src/db/prismaClient'
import helpers from 'src/lib/utils/ejsHelpers'
import supabaseAdmin from 'src/db/supabaseAdminClient'
import { Readable } from 'stream'
import { defaultError, defaultErrorQuery } from 'src/lib/utils/errorMessages'

// GET: /
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
    error: req.query.error,
    success: req.query.success,
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
    error: req.query.error,
    success: req.query.success,
  })
}

// POST: /new Create a new folder
const createFolder = async (req: Request, res: Response) => {
  {
    const id = req.user?.id
    if (!id) return res.status(401).send({ errors: [{ message: defaultError }] })

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

// Unused function to allow client to upload directly to supabase bucket
const getUploadUrl = async (req: Request, res: Response) => {
  const id = req.user?.id
  if (!id) return res.status(401).send({ errors: [{ message: defaultError }] })

  console.log('Request body: ', req.body)
  const filename = req.body.filename
  const bucketName = 'files'
  const filePath = `${id}/${filename}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(filePath) // URL valid for 60 seconds
  if (error) {
    console.log(error)
    return res.status(500).send({ errors: [{ message: defaultError }] })
  }

  res.send({ signedUrl: data.signedUrl })
}

// POST: /upload Upload a file
const uploadFile = async (req: Request, res: Response) => {
  {
    try {
      const id = req.user?.id
      const file = req.file
      if (!id) return res.status(401).send({ errors: [{ message: defaultError }] })

      // req.file is the name of the user's file in the form, 'uploaded_file'
      if (!file) return res.status(400).send({ errors: [{ message: 'Bad request' }] })
      const { originalname, mimetype, size, buffer } = file
      const parentId = Number(req.body.parentId) || null

      const bucketName = 'files'
      const options = {
        contentType: mimetype,
        upsert: false,
        duplex: 'half', // allows binary stream, otherwise must convert: decode(buffer.toString('base64')
      }
      const filePath = `${id}/${originalname}`

      const bufferStream = new Readable()
      bufferStream.push(buffer)
      bufferStream.push(null) // end of stream

      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, bufferStream, options)

      if (error) {
        console.log(error)
        if ('statusCode' in error) {
          if (error.statusCode === '409') {
            // duplicate file
            return res.redirect(`/${parentId}?error=${encodeURIComponent(error.message)}`)
          } else if (error.statusCode === '413') {
            // file size limit exceeded
            return res.redirect(`/${parentId}?error=${encodeURIComponent(error.message)}`)
          }
        }
        return res.redirect(`/${parentId}?error=${defaultErrorQuery}`)
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

    if (!userId) return res.status(401).send({ errors: [{ message: 'Unauthorized' }] })

    const { type, parentId } = req.body

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

    return res.redirect(`/${parentId}?success=${encodeURIComponent('Deleted Successfully')}`)

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
    const parentId = req.query.parentId || ''
    const filePath = `${req.user?.id}/${fileName}`
    const { data } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 60, { download: true })

    if (data?.signedUrl) {
      res.redirect(data.signedUrl)
    } else {
      console.log('Error fetching signed URL')
      res.redirect(`/${parentId}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    console.log(err)
  }
}

// GET: /public/download/:entityId
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
      res.redirect(`/${req.originalUrl}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    console.log(err)
  }
}

// GET: /share/file/:fileName
const shareFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName } = req.params
    const filePath = `${req.user?.id}/${fileName}`
    const { data } = await supabaseAdmin.storage
      .from('files')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7)

    if (!data) {
      return res.status(500).send({ errors: [{ message: defaultError }] })
    }
    res.json(data.signedUrl)
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /share/folder/:entityId
const shareFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).send({ errors: [{ message: 'Unauthorized' }] })

    const id = Number(req.params.entityId)
    const defaultDuration = 60 * 60 * 24 * 3 * 1000 // 3 days
    const durationMS = Number(req.query.h) * 60 * 60 * 1000 || defaultDuration
    const expiresAt = new Date(Date.now() + durationMS)

    const newSharedFolder = await prisma.sharedFolder.create({
      data: {
        userId,
        folderId: id,
        expiresAt,
      },
    })
    if (!newSharedFolder) {
      return res.status(500).send({ errors: [{ message: 'Error creating shared folder' }] })
    }

    res.json({ publicUrl: `http:localhost:3000/public/${newSharedFolder.id}` })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /public/:entityId Or unique publicSessionId?
const getPublicFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.sharedFolderId
    if (!id) return res.redirect('/')

    const { sortCriteria } = req

    const sharedFolder = await prisma.sharedFolder.findUnique({
      where: { id },
      include: { folder: true },
    })
    if (!sharedFolder) {
      return res.status(404).send({ errors: [{ message: 'Not found' }] })
    }

    if (new Date() > sharedFolder.expiresAt) {
      console.log('Link has expired')
      return res.status(404).send('Not found')
    }

    const userId = sharedFolder.userId
    const path = Number(req.query.path)
    const rootFolder = { id: sharedFolder.folderId, name: sharedFolder.folder.name }
    let currentFolderId = rootFolder.id
    if (path) {
      const currentFolderEntry = await prisma.entity.findUnique({ where: { id: path } })
      currentFolderEntry && (currentFolderId = currentFolderEntry.id)
    }

    const files = await prisma.entity.findMany({
      where: { userId, parentId: currentFolderId },
      orderBy: sortCriteria,
    })
    if (!files) return res.status(404).send('Not found')

    const folders = await getFolderTree(4, rootFolder.id)
    const pathSegments = await getPathSegments(currentFolderId)
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
      currentFolderId,
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
