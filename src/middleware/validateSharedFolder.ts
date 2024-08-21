import { Request, Response, NextFunction } from 'express'
import { getSharedFolderById, isChildOf } from '../services/dirService'

export const validateSharedFolder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sharedFolderId, entityId } = req.params

    if (!sharedFolderId) return res.status(404).send('Not found')

    // Check that shared folder exists
    const sharedFolder = await getSharedFolderById(sharedFolderId)
    if (!sharedFolder) {
      return res.status(404).send('Not found')
    }

    // Check that shared folder has not expired
    if (new Date() > sharedFolder.expiresAt) {
      return res.status(404).send('Not found')
    }

    req.sharedFolder = sharedFolder

    // If an entityId is provided, validate that it belongs to the shared folder
    if (entityId) {
      const isSharedEntity = await isChildOf(sharedFolder.folderId, Number(entityId))
      if (!isSharedEntity) {
        return res.status(404).send('Not found')
      }
      req.entityId = Number(entityId)
    }

    next()
  } catch (err) {
    next(err)
  }
}
