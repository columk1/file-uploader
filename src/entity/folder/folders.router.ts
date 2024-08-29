import { Router } from 'express'
import { deleteFolder, getFolder, handleCreateFolder } from '@/entity/folder/folders.controller'
import { handleSortQuery } from '@/middleware/handleSortQuery'
import { cacheMiddleware } from '@/middleware/cacheMiddleware'

const router = Router()

router.get(['/', '/:folderId'], handleSortQuery, cacheMiddleware(5000), getFolder)
router.post('/', handleCreateFolder)
router.delete('/:folderId', deleteFolder)

export default router
