import type { RequestHandler } from 'express'
import createError from 'http-errors'
import {
  createFolder,
  deleteEntityById,
  getAllFilenames,
  getEntityById,
} from 'src/entity/entities.repository'
import { getFolderData, getRootFolderData } from 'src/entity/folder/folders.service'
import helpers from 'src/lib/utils/ejsHelpers'
import { storage } from 'src/storage/storage.repository'

// GET: ['/', '/folders/:folderId]
const getFolder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user?.id) throw new createError.Unauthorized()
    const { id, username } = req.user

    const folderId = Number(req.params.folderId)

    const { sortCriteria } = req

    const rootFolder = { id: null, name: username }

    const folderData = !folderId
      ? await getRootFolderData(id, sortCriteria)
      : await getFolderData(folderId, id, sortCriteria)

    res.render('folder', {
      title: 'File Uploader',
      ...folderData,
      folderId,
      rootFolder,
      helpers,
      error: req.query.error,
      success: req.query.success,
    })
  } catch (err) {
    next(err)
  }
}

// POST: /new Create a new folder
const handleCreateFolder: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    const parentId = Number(req.body.parentId) || null
    const name = req.body.name || 'New Folder'

    const newFolder = await createFolder(userId, parentId, name)
    res.redirect('back')
  } catch (err) {
    next(err)
  }
}

// Unused function to allow client to upload directly to supabase bucket
const getUploadUrl: RequestHandler = async (req, res, next) => {
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
const deleteFolder: RequestHandler = async (req, res, next) => {
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
    for (const filename of filenames) {
      await storage.deleteFile('files', `${userId}/${filename}`)
    }
  } catch (err) {
    next(err)
  }
}

export { getFolder, handleCreateFolder, getUploadUrl, deleteFolder }
