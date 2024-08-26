import { Router } from 'express'
import { shareFile, shareFolder } from 'src/share/share.controller'

const router = Router()

router.get('/file/:fileId', shareFile)
router.get('/folder/:folderId', shareFolder)

export default router
