import { Router } from 'express'
import multer from 'multer'
import {
  handleDeleteFile,
  handleFileDownload,
  handleFileUpload,
} from '@/entity/file/files.controller'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.post('/', upload.single('uploaded_file'), handleFileUpload)
router.delete('/:fileId', handleDeleteFile)
router.get('/download/:fileId', handleFileDownload)

export default router
