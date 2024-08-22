import { NextFunction, Request, Response } from 'express'
import {
  createFile,
  createFolder,
  createSharedFolder,
  deleteEntityById,
  getAllFilenames,
  getFolderTree,
  getPathSegments,
  getFolderContents,
  getFilename,
} from 'src/services/dirService'
import { storage } from 'src/services/storageService'
import helpers from 'src/lib/utils/ejsHelpers'
import { Readable } from 'stream'
import { defaultError, defaultErrorQuery } from 'src/lib/utils/errorMessages'
import { getUserEntities, getFolderEntityById } from 'src/services/dirService'

// GET: /
const getDashboard = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).send({ errors: [{ message: defaultError }] })

  const { sortCriteria } = req

  const files = await getUserEntities(userId, sortCriteria)

  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(req.user?.id, null)
  const rootFolder = { id: null, name: req.user?.username }

  res.render('dashboard', {
    title: 'File Uploader',
    files,
    folders,
    folderId: null,
    parentId: null,
    rootFolder,
    pathSegments: null,
    sortQuery,
    helpers,
    error: req.query.error,
    success: req.query.success,
  })
}

// GET: /:folderId (Same view as Dashboard)
const getFolder = async (req: Request, res: Response) => {
  const folderId = Number(req.params.entityId)
  if (!folderId) return res.redirect('/')

  const { sortCriteria } = req

  const entity = await getFolderEntityById(folderId, sortCriteria)
  if (!entity) return res.status(404).send('Not found')

  const { name, type, childEntities: files, parentId } = entity
  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(req.user?.id, null)
  const rootFolder = { id: null, name: req.user?.username }
  const pathSegments = await getPathSegments(folderId)

  res.render('dashboard', {
    title: 'File Uploader',
    folderId,
    name,
    type,
    files,
    parentId,
    rootFolder,
    pathSegments,
    folders,
    sortQuery,
    helpers,
    error: req.query.error,
    success: req.query.success,
  })
}

// POST: /new Create a new folder
const handleCreateFolder = async (req: Request, res: Response) => {
  {
    const userId = req.user?.id
    if (!userId) return res.status(401).send({ errors: [{ message: defaultError }] })

    const parentId = Number(req.body.parentId) || null
    const name = req.body.name || 'New Folder'

    const newFolder = await createFolder(userId, parentId, name)
    res.redirect(`back`)
  }
}

// Unused function to allow client to upload directly to supabase bucket
const getUploadUrl = async (req: Request, res: Response) => {
  const id = req.user?.id
  if (!id) return res.status(401).send({ errors: [{ message: defaultError }] })

  const filename = req.body.filename
  const bucketName = 'files'
  const filePath = `${id}/${filename}`

  const fileUploadUrl = await storage.getFileUploadUrl(bucketName, filePath)
  if (!fileUploadUrl) {
    return res.status(500).send({ errors: [{ message: defaultError }] })
  }
  res.send({ fileUploadUrl })
}

// POST: /upload Upload a file
const uploadFile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).send({ errors: [{ message: defaultError }] })

    // req.file is the name of the user's file in the form, 'uploaded_file'
    const file = req.file
    if (!file) return res.status(400).send({ errors: [{ message: 'Bad request' }] })

    const { originalname, mimetype, size, buffer } = file
    const parentId = Number(req.body.parentId) || null

    const bucketName = 'files'
    const options = {
      contentType: mimetype,
      upsert: false,
      duplex: 'half' as 'half' | 'full', // allows binary stream, otherwise must convert: decode(buffer.toString('base64')
    }
    const filePath = `${userId}/${originalname}`

    const bufferStream = new Readable()
    bufferStream.push(buffer)
    bufferStream.push(null) // end of stream

    const { data, error } = await storage.uploadFile(bucketName, filePath, bufferStream, options)

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

    // add to database
    await createFile(originalname, mimetype, size, userId, parentId)

    res.redirect('/' + parentId)
  } catch (error) {
    console.log(error)
  }
}

// POST: /delete/:entityId
const deleteEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.entityId)
    const userId = req.user?.id

    if (!userId) return res.status(401).send({ errors: [{ message: 'Unauthorized' }] })

    const { type, parentId } = req.body

    const filenames =
      type === 'FOLDER'
        ? await getAllFilenames(userId, id) // recursively get all filenames
        : [await getFilename(id)]

    await deleteEntityById(id)

    res.redirect(`/${parentId}?success=${encodeURIComponent('Deleted Successfully')}`)

    // Continue to remove from storage
    filenames.forEach(async (filename) => {
      const deletedFile = await storage.deleteFile('files', `${userId}/${filename}`)
    })
  } catch (err) {
    next(err)
  }
}

// GET: /download/:entityId // ?: could use filename as params instead of query
const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, parentId } = req.query
    const filePath = `${req.user?.id}/${filename}`

    const fileDownloadUrl = await storage.getFileUrl(filePath, 60, { download: true })

    if (fileDownloadUrl) {
      res.redirect(fileDownloadUrl)
    } else {
      res.redirect(`/${parentId}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /share/file/:fileName
const shareFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName } = req.params
    const filePath = `${req.user?.id}/${fileName}`
    const publicUrl = await storage.getFileUrl(filePath, 60 * 60 * 24 * 7)

    if (!publicUrl) {
      return res.status(500).json({ error: defaultError })
    }
    res.json({ publicUrl })
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

    const folderId = Number(req.params.entityId)
    const defaultDuration = 60 * 60 * 24 * 3 * 1000 // 3 days
    const durationMS = Number(req.query.h) * 60 * 60 * 1000 || defaultDuration
    const expiresAt = new Date(Date.now() + durationMS)

    const newSharedFolder = await createSharedFolder(userId, folderId, expiresAt)
    if (!newSharedFolder) {
      return res.status(500).json({ error: defaultError })
    }

    res.json({ publicUrl: `http:localhost:3000/public/${newSharedFolder.id}` })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /public/:sharedFolderId/:entityId
const getPublicFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedFolderId = req.params.sharedFolderId
    const { sortCriteria, sharedFolder, entityId } = req
    if (!sharedFolder) return res.status(404).send('Not found')

    const rootFolder = { id: sharedFolder.folderId, name: sharedFolder.folder.name }
    const folderId = entityId ? entityId : rootFolder.id

    const files = await getFolderContents(folderId, sortCriteria)
    if (!files) return res.status(404).send('Not found')

    const folders = await getFolderTree(4, rootFolder.id)
    const pathSegments = await getPathSegments(folderId)
    const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})

    res.render('public-folder', {
      title: 'File Uploader',
      sharedFolderId,
      folderId,
      files,
      folders,
      helpers,
      pathSegments,
      sortQuery,
      rootFolder,
      error: req.query.error,
      success: req.query.success,
      baseUrl: `/public/${sharedFolderId}`,
    })
  } catch (err) {
    console.log(err)
    next(err)
  }
}

// GET: /public/:sharedFolderId/download/:entityId
const handleSharedFileDownload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sharedFolder } = req
    const { filename, parentId } = req.query

    const userId = sharedFolder.userId
    const filePath = `${userId}/${filename}`

    const publicUrl = await storage.getFileUrl(filePath, 60)

    if (publicUrl) {
      res.redirect(publicUrl)
    } else {
      res.redirect(`/public/${sharedFolder.id}/${parentId}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    console.log(err)
    next(err)
  }
}

export {
  getDashboard,
  getFolder,
  handleCreateFolder,
  getUploadUrl,
  uploadFile,
  deleteEntity,
  downloadFile,
  handleSharedFileDownload,
  shareFile,
  shareFolder,
  getPublicFolder,
}
