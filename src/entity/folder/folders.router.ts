import { Router } from 'express'
import { handleCreateFolder, getFolder, deleteFolder } from 'src/entity/folder/folders.controller'
import { handleSortQuery } from 'src/middleware/handleSortQuery'

const router = Router()

router.get(['/', '/:folderId'], handleSortQuery, getFolder)
router.post('/', handleCreateFolder)
router.delete('/:folderId', deleteFolder)

export default router
