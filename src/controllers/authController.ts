import asyncHandler from 'express-async-handler'
import { NextFunction, Request, Response } from 'express'
import passport from 'src/auth/passportConfig'
import bcrypt from 'bcrypt'
import { SignUpSchema } from 'src/models/schemas'
import { createUser, findUserByUsername } from 'src/repositories/users.repository'
import { Prisma } from '@prisma/client'

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // returns a middleware function which is immediately invoked with (req, res, next)
    passport.authenticate('local', {
      failureMessage: true,
      successRedirect: '/',
      failureRedirect: '/login',
    })(req, res, next)
  } catch (err) {
    next(err)
  }
}

// Todo: create type for possible error messages
export const renderLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.isAuthenticated()) return res.redirect('/')
    let usernameError, passwordError
    const { messages } = req.session
    if (messages) {
      if (messages[0].includes('Username')) {
        usernameError = messages[0]
      } else {
        if (messages[0].includes('password')) {
          passwordError = messages[0]
        } else {
          usernameError = 'Invalid credentials'
        }
      }
    }
    req.session.messages = undefined
    res.render('login', { title: 'Login', usernameError, passwordError })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) =>
  req.logout((err) => (err ? next(err) : res.redirect('/')))

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const defaultErrorMessage =
    'Validation failed. Please ensure all fields are filled out correctly.'
  try {
    const validationResult = SignUpSchema.safeParse(req.body)
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors
      return res.status(400).render('sign-up', {
        title: 'Sign Up',
        usernameError: errors.username ? errors.username[0] : null,
        passwordError: errors.password ? errors.password[0] : null,
        error: defaultErrorMessage,
      })
    }

    const { username, password } = validationResult.data

    const hashedPassword = await bcrypt.hash(password, 10)

    await createUser(username, hashedPassword)

    res.redirect('/')
  } catch (err) {
    let errorMessage = 'Internal Error'
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      errorMessage = 'An account with that username already exists'
    }
    return res.status(400).render('sign-up', { title: 'Sign Up', usernameError: errorMessage })
  }
}

export const renderSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.isAuthenticated()) return res.redirect('/')
    res.render('sign-up', { title: 'Sign Up' })
  } catch (err) {
    next(err)
  }
}

export const validateUniqueUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.query.username
    if (!username || typeof username !== 'string') {
      return res.status(401).json({ isAvailable: false })
    }
    const user = await findUserByUsername(username)
    res.status(200).json({ isAvailable: !user })
  } catch (err) {
    next(err)
  }
}
