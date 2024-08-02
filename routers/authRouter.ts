import { Router } from 'express'
import { login, logout, signup, renderLogin, renderSignup } from '../controllers/authController'

const router = Router()

router.route('/sign-up').get(renderSignup).post(signup)
router.route('/login').get(renderLogin).post(login)
router.route('/logout').get(logout)

export default router
