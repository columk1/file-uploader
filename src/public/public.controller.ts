import type { RequestHandler } from 'express'
import createError from 'http-errors'
import { getPublicFolderData } from '@/entity/folder/folders.service'
import helpers from '@/lib/utils/ejsHelpers'
import { defaultErrorQuery } from '@/lib/utils/errorMessages'
import { storage } from '@/storage/storage.repository'

// GET: /public/:sharedFolderId/:folderId
export const getPublicFolder: RequestHandler = async (req, res, next) => {
  try {
    const sharedFolderId = req.params.sharedFolderId
    const { sortCriteria, sharedFolder } = req
    if (!sharedFolder) {
      throw new createError.NotFound()
    }

    const folderId = req.params.folderId ? Number(req.params.folderId) : sharedFolder.folderId
    const rootFolder = { id: sharedFolder.folderId, name: sharedFolder.folder.name }

    const publicFolderData = await getPublicFolderData(
      sharedFolder.userId,
      rootFolder.id,
      folderId,
      sortCriteria
    )

    res.render('public-folder', {
      title: 'Public Folder',
      sharedFolderId,
      folderId,
      ...publicFolderData,
      helpers,
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
export const handleSharedFileDownload: RequestHandler = async (req, res, next) => {
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
