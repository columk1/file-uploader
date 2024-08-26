import { Router } from 'express'
import {
  login,
  logout,
  signup,
  renderLogin,
  renderSignup,
  validateUniqueUsername,
} from 'src/auth/auth.controller'

const router = Router()

router.route('/sign-up').get(renderSignup).post(signup)
router.route('/login').get(renderLogin).post(login)
router.route('/logout').get(logout)
router.route('/validate-username').get(validateUniqueUsername)

export default router
