import { Router } from 'express'
import { handleFileUpload, handleFileDownload, deleteFile } from 'src/controllers/fileController'
import { isAuthenticated } from 'src/middleware/isAuthenticated'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/', upload.single('uploaded_file'), handleFileUpload)
router.delete('/:fileId', deleteFile)
router.get('/download/:fileId', handleFileDownload)

export default router
