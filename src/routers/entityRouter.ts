import { Router } from 'express'
import {
  getDashboard,
  getEntityById,
  uploadFile,
  deleteEntity,
  downloadFile,
  shareFile,
  createFolder,
  shareFolder,
  getPublicFolder,
} from 'src/controllers/entityController'
import { isAuthenticated } from 'src/middleware/isAuthenticated'
import { handleSortQuery } from 'src/middleware/handleSortQuery'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.get('/', isAuthenticated, handleSortQuery, getDashboard)
router.get('/:entityId', isAuthenticated, handleSortQuery, getEntityById)
router.post('/new', isAuthenticated, createFolder)
router.post('/upload', isAuthenticated, upload.single('uploaded_file'), uploadFile)
router.post('/delete/:entityId', isAuthenticated, deleteEntity)
router.get('/download/:entityId', isAuthenticated, downloadFile)
router.get('/share/file/:fileName', isAuthenticated, shareFile)
router.get('/share/folder/:entityId', isAuthenticated, shareFolder)
router.get('/public/:entityId', handleSortQuery, getPublicFolder)

export default router
