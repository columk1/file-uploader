import { Router } from 'express'
import { deleteFolder, getFolder, handleCreateFolder } from '@/entity/folder/folders.controller'
import { handleSortQuery } from '@/middleware/handleSortQuery'

const router = Router()

router.get(['/', '/:folderId'], handleSortQuery, getFolder)
router.post('/', handleCreateFolder)
router.delete('/:folderId', deleteFolder)

export default router
