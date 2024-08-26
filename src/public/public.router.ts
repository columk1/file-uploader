import { Router } from 'express'
import { getPublicFolder, handleSharedFileDownload } from './public.controller'
import { handleSortQuery } from '../middleware/handleSortQuery'
import { validateSharedFolder } from '../middleware/validateSharedFolder'

const router = Router()

router.get(
  ['/:sharedFolderId', '/:sharedFolderId/:folderId'],
  validateSharedFolder,
  handleSortQuery,
  getPublicFolder
)
router.get('/:sharedFolderId/download/:fileId', validateSharedFolder, handleSharedFileDownload)

export default router
