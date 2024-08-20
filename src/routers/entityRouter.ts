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
  downloadPublicFile,
} from 'src/controllers/entityController'
import { isAuthenticated } from 'src/middleware/isAuthenticated'
import { handleSortQuery } from 'src/middleware/handleSortQuery'
import { checkPublicAccess } from 'src/middleware/checkPublicAccess'
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
router.get('/public/:sharedFolderId', handleSortQuery, getPublicFolder)
router.get('/public/download/:entityId', checkPublicAccess, downloadPublicFile)

export default router
