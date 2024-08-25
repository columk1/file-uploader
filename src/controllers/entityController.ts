import { NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import {
  createFile,
  createFolder,
  createSharedFolder,
  deleteEntityById,
  getAllFilenames,
  getFolderTree,
  getPathSegments,
  getFolderContents,
  getEntityById,
  getFileById,
} from 'src/services/dirService'
import { storage } from 'src/services/storageService'
import helpers from 'src/lib/utils/ejsHelpers'
import { Readable } from 'stream'
import { defaultError, defaultErrorQuery } from 'src/lib/utils/errorMessages'
import { getUserEntities, getFolderEntityById } from 'src/services/dirService'

// GET: /
const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

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
  } catch (err) {
    next(err)
  }
}

// GET: /:folderId (Same view as Dashboard)
const getFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folderId = Number(req.params.entityId)
    if (!folderId) return res.redirect('/')

    const { sortCriteria } = req

    const entity = await getFolderEntityById(folderId, sortCriteria)
    if (!entity) {
      throw new createError.NotFound()
    }

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
  } catch (err) {
    next(err)
  }
}

// POST: /new Create a new folder
const handleCreateFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    const parentId = Number(req.body.parentId) || null
    const name = req.body.name || 'New Folder'

    const newFolder = await createFolder(userId, parentId, name)
    res.redirect(`back`)
  } catch (err) {
    next(err)
  }
}

// Unused function to allow client to upload directly to supabase bucket
const getUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    const filename = req.body.filename
    const bucketName = 'files'
    const filePath = `${userId}/${filename}`

    const fileUploadUrl = await storage.getFileUploadUrl(bucketName, filePath)
    if (!fileUploadUrl) {
      throw new createError.InternalServerError()
    }

    res.send({ fileUploadUrl })
  } catch (err) {
    next(err)
  }
}

// POST: /files Upload a file
const handleFileUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    // req.file is the name of the user's file in the form, 'uploaded_file'
    const file = req.file
    const parentId = Number(req.body.parentId) || null
    if (!file) return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(defaultError)}`)

    const { originalname, mimetype, size, buffer } = file

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
          return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(error.message)}`)
        } else if (error.statusCode === '413') {
          // file size limit exceeded
          return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(error.message)}`)
        }
      }
      return res.redirect(`/folders/${parentId}?error=${defaultErrorQuery}`)
    }

    // add to database
    await createFile(originalname, mimetype, size, userId, parentId)

    res.redirect('/folders/' + parentId)
  } catch (error) {
    next(error)
  }
}

// DELETE: /files/:fileId
const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Number(req.params.fileId)
    const userId = req.user?.id

    if (!userId) throw new createError.Unauthorized()

    // const { parentId } = req.body

    const file = await getEntityById(fileId)
    if (!file) throw new createError.NotFound()

    const { name, parentId } = file
    await deleteEntityById(fileId)

    res.redirect(`/folders/${parentId}?success=${encodeURIComponent('Deleted Successfully')}`)

    // Continue to remove from storage
    const deletedFile = storage.deleteFile('files', `${userId}/${name}`)
  } catch (err) {
    next(err)
  }
}

// DELETE: /folders/:folderId
const deleteFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folderId = Number(req.params.folderId)
    const userId = req.user?.id

    if (!userId) throw new createError.Unauthorized()

    const folder = await getEntityById(folderId)
    if (!folder) throw new createError.NotFound()

    await deleteEntityById(folderId)

    res.redirect(
      `/folders/${folder.parentId}?success=${encodeURIComponent('Deleted Successfully')}`
    )

    // Continue to remove from storage
    const filenames = await getAllFilenames(userId, folderId) // recursively get all filenames
    filenames.forEach(async (filename) => {
      const deletedFile = await storage.deleteFile('files', `${userId}/${filename}`)
    })
  } catch (err) {
    next(err)
  }
}

// GET: /download/:fileId // ?: could use filename as params instead of query
const handleFileDownload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Number(req.params.fileId)
    const file = await getFileById(fileId)

    if (!file) throw new createError.NotFound()

    const { name: filename, parentId } = file
    const filePath = `${req.user?.id}/${filename}`

    const fileDownloadUrl = await storage.getFileUrl(filePath, 60, { download: true })

    if (fileDownloadUrl) {
      res.redirect(fileDownloadUrl)
    } else {
      res.redirect(`/${parentId}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    next(err)
  }
}

// GET: /share/file/:fileId
const shareFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Number(req.params.fileId)
    const file = await getFileById(fileId)

    if (!file) throw new createError.NotFound()

    const { name: filename } = file
    const filePath = `${req.user?.id}/${filename}`
    const publicUrl = await storage.getFileUrl(filePath, 60 * 60 * 24 * 7)

    if (!publicUrl) {
      return res.status(500).json({ error: defaultError })
    }
    res.json({ publicUrl })
  } catch (err) {
    next(err)
  }
}

// GET: /share/folder/:folderId
const shareFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    const folderId = Number(req.params.folderId)
    const defaultDuration = 60 * 60 * 24 * 3 * 1000 // 3 days
    const durationMS = Number(req.query.h) * 60 * 60 * 1000 || defaultDuration
    const expiresAt = new Date(Date.now() + durationMS)

    const newSharedFolder = await createSharedFolder(userId, folderId, expiresAt)
    if (!newSharedFolder) {
      return res.status(500).json({ error: defaultError })
    }

    res.json({ publicUrl: `http:localhost:3000/public/${newSharedFolder.id}` })
  } catch (err) {
    next(err)
  }
}

// GET: /public/:sharedFolderId/:folderId
const getPublicFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedFolderId = req.params.sharedFolderId
    const { sortCriteria, sharedFolder } = req
    if (!sharedFolder) {
      throw new createError.NotFound()
    }

    const folderId = req.params.folderId ? Number(req.params.folderId) : sharedFolder.folderId
    const rootFolder = { id: sharedFolder.folderId, name: sharedFolder.folder.name }

    const files = await getFolderContents(folderId, sortCriteria)
    if (!files) {
      throw new createError.NotFound()
    }

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
    next(err)
  }
}

// GET: /public/:sharedFolderId/download/:fileId
const handleSharedFileDownload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sharedFolder } = req
    const { filename, parentId } = req.query

    const userId = sharedFolder.userId
    const filePath = `${userId}/${filename}`

    const publicUrl = await storage.getFileUrl(filePath, 60, { download: true })

    if (publicUrl) {
      res.redirect(publicUrl)
    } else {
      res.redirect(`/public/${sharedFolder.id}/${parentId}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    next(err)
  }
}

export {
  getDashboard,
  getFolder,
  handleCreateFolder,
  getUploadUrl,
  handleFileUpload,
  deleteFile,
  deleteFolder,
  handleFileDownload,
  handleSharedFileDownload,
  shareFile,
  shareFolder,
  getPublicFolder,
}
