import { Router } from 'express'
import {
  getDashboard,
  getFolder,
  uploadFile,
  deleteEntity,
  downloadFile,
  shareFile,
  handleCreateFolder,
  shareFolder,
  getPublicFolder,
  handleSharedFileDownload,
} from 'src/controllers/entityController'
import { isAuthenticated } from 'src/middleware/isAuthenticated'
import { handleSortQuery } from 'src/middleware/handleSortQuery'
import { validateSharedFolder } from 'src/middleware/validateSharedFolder'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.get('/', isAuthenticated, handleSortQuery, getDashboard)
router.get('/:entityId', isAuthenticated, handleSortQuery, getFolder)
router.post('/new', isAuthenticated, handleCreateFolder)
router.post('/upload', isAuthenticated, upload.single('uploaded_file'), uploadFile)
router.post('/delete/:entityId', isAuthenticated, deleteEntity)
router.get('/download/:entityId', isAuthenticated, downloadFile)
router.get('/share/file/:fileName', isAuthenticated, shareFile)
router.get('/share/folder/:entityId', isAuthenticated, shareFolder)
router.get(
  ['/public/:sharedFolderId', '/public/:sharedFolderId/:entityId'],
  validateSharedFolder,
  handleSortQuery,
  getPublicFolder
)
router.get(
  '/public/:sharedFolderId/download/:entityId',
  validateSharedFolder,
  handleSharedFileDownload
)

export default router
