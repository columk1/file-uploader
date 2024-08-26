import { Router } from 'express'
import {
  handleFileUpload,
  handleFileDownload,
  handleDeleteFile,
} from 'src/controllers/fileController'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/', upload.single('uploaded_file'), handleFileUpload)
router.delete('/:fileId', handleDeleteFile)
router.get('/download/:fileId', handleFileDownload)

export default router
