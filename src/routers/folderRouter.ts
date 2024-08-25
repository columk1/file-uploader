import { Router } from 'express'
import {
  getDashboard,
  handleCreateFolder,
  getFolder,
  deleteFolder,
} from 'src/controllers/folderController'
import { handleSortQuery } from 'src/middleware/handleSortQuery'

const router = Router()

router.get('/', handleSortQuery, getDashboard)
router.post('/', handleCreateFolder)
router.get('/:folderId', handleSortQuery, getFolder)
router.delete('/:folderId', deleteFolder)

export default router
