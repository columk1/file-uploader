import { Router } from 'express'
import { deleteFolder, getFolder, handleCreateFolder } from 'src/entity/folder/folders.controller'
import { handleSortQuery } from 'src/middleware/handleSortQuery'

const router = Router()

router.get(['/', '/:folderId'], handleSortQuery, getFolder)
router.post('/', handleCreateFolder)
router.delete('/:folderId', deleteFolder)

export default router
