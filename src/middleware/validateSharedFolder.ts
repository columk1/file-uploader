import { Request, Response, NextFunction } from 'express'
import { getSharedFolderById, isChildOf } from 'src/services/entityService'
import createError from 'http-errors'

export const validateSharedFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sharedFolderId, folderId } = req.params

    if (!sharedFolderId) throw new createError.NotFound()

    // Check that shared folder exists
    const sharedFolder = await getSharedFolderById(sharedFolderId)
    if (!sharedFolder) {
      throw new createError.NotFound()
    }

    // Check that shared folder has not expired
    if (new Date() > sharedFolder.expiresAt) {
      throw new createError.Gone('The Requested Link has Expired')
    }

    req.sharedFolder = sharedFolder

    // If a folderId is provided, validate that it belongs to the shared folder
    if (folderId) {
      const isSharedEntity = await isChildOf(sharedFolder.folderId, Number(folderId))
      if (!isSharedEntity) {
        throw new createError.NotFound()
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
