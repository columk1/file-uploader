import { NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import {
  createFolder,
  deleteEntityById,
  getAllFilenames,
  getFolderTree,
  getPathSegments,
  getEntityById,
  getFolderEntityById,
  getUserEntities,
} from 'src/repositories/entities.repository'
import { storage } from 'src/repositories/storage.repository'
import helpers from 'src/lib/utils/ejsHelpers'

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
    const folderId = Number(req.params.folderId)
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

export { getDashboard, getFolder, handleCreateFolder, getUploadUrl, deleteFolder }
