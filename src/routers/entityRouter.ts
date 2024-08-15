import { Router } from 'express'
import { getDashboard, getEntityById } from 'src/controllers/entityController'
import { isAuthenticated } from 'src/middleware/isAuthenticated'
import { handleSortQuery } from 'src/middleware/handleSortQuery'

const router = Router()

router.get('/', isAuthenticated, handleSortQuery, getDashboard)
router.get('/:entityId', isAuthenticated, handleSortQuery, getEntityById)

export default router
