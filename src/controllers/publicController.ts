import { Request, Response, NextFunction } from 'express'
import createError from 'http-errors'
import { getFolderContents, getFolderTree, getPathSegments } from '../services/entityService'
import helpers from 'src/lib/utils/ejsHelpers'
import { defaultErrorQuery } from 'src/lib/utils/errorMessages'
import { storage } from 'src/services/storageService'

// GET: /public/:sharedFolderId/:folderId
export const getPublicFolder = async (req: Request, res: Response, next: NextFunction) => {
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
export const handleSharedFileDownload = async (req: Request, res: Response, next: NextFunction) => {
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
