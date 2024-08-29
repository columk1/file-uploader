import { Router } from 'express'
import {
  login,
  logout,
  renderLogin,
  renderSignup,
  signup,
  validateUniqueUsername,
} from '@/auth/auth.controller'
import { cacheMiddleware } from '@/middleware/cacheMiddleware'

const router = Router()

router.route('/sign-up').get(cacheMiddleware(5000), renderSignup).post(signup)
router.route('/login').get(cacheMiddleware(5000), renderLogin).post(login)
router.route('/logout').get(logout)
router.route('/validate-username').get(validateUniqueUsername)

export default router
