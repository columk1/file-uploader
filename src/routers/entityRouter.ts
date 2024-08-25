import { Router } from 'express'
import {
  getDashboard,
  getFolder,
  handleFileUpload,
  deleteFolder,
  handleFileDownload,
  shareFile,
  handleCreateFolder,
  shareFolder,
  getPublicFolder,
  handleSharedFileDownload,
  deleteFile,
} from 'src/controllers/entityController'
import { isAuthenticated } from 'src/middleware/isAuthenticated'
import { handleSortQuery } from 'src/middleware/handleSortQuery'
import { validateSharedFolder } from 'src/middleware/validateSharedFolder'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

const router = Router()

router.get(['/', '/folders'], isAuthenticated, handleSortQuery, getDashboard)
router.post('/folders', isAuthenticated, handleCreateFolder)
router.get('/folders/:entityId', isAuthenticated, handleSortQuery, getFolder)
router.delete('/folders/:folderId', isAuthenticated, deleteFolder)

router.post('/files', isAuthenticated, upload.single('uploaded_file'), handleFileUpload)
router.delete('/files/:fileId', isAuthenticated, deleteFile)
router.get('/files/download/:fileId', isAuthenticated, handleFileDownload)

router.get('/share/file/:fileId', isAuthenticated, shareFile)
router.get('/share/folder/:folderId', isAuthenticated, shareFolder)

router.get(
  ['/public/:sharedFolderId', '/public/:sharedFolderId/:folderId'],
  validateSharedFolder,
  handleSortQuery,
  getPublicFolder
)
router.get(
  '/public/:sharedFolderId/download/:fileId',
  validateSharedFolder,
  handleSharedFileDownload
)

export default router
