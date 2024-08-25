import { Router } from 'express'
import { shareFile, shareFolder } from 'src/controllers/shareController'

const router = Router()

router.get('/file/:fileId', shareFile)
router.get('/folder/:folderId', shareFolder)

export default router
