import asyncHandler from 'express-async-handler'
import passport from 'src/auth/passportConfig'
import prisma from 'src/db/prismaClient'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { SignUpSchema } from 'src/models/schemas'

export const login = asyncHandler(async (req, res, next) => {
  // returns a middleware function which is immediately invoked with (req, res, next)
  passport.authenticate('local', {
    failureMessage: true,
    successRedirect: '/',
    failureRedirect: '/login',
  })(req, res, next)
})

// Todo: create type for possible error messages

export const renderLogin = asyncHandler(async (req, res) => {
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
})

export const logout = asyncHandler(async (req, res, next) => {
  req.logout((err) => (err ? next(err) : res.redirect('/')))
})

export const signup = asyncHandler(async (req, res, next) => {
  const defaultErrorMessage =
    'Validation failed. Please ensure all fields are filled out correctly.'

  if (!req.body.username || !req.body.password) {
    return res.status(400).render('sign-up', { title: 'Sign Up', error: defaultErrorMessage })
  }

  const validatedFields = SignUpSchema.safeParse(req.body)
  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors)
    return res.status(400).render('sign-up', { title: 'Sign Up', error: defaultErrorMessage })
  }
  const { username, password } = validatedFields.data

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    })
  } catch (err: any) {
    let message = 'Internal Error'
    if (err?.code === 'P2002') {
      message = 'An account with that username already exists'
    }
    return res.status(400).render('sign-up', { title: 'Sign Up', usernameError: message })
  }
  res.redirect('/')
})

export const renderSignup = asyncHandler(async (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/')
  res.render('sign-up', { title: 'Sign Up' })
})

export const validateUniqueUsername = asyncHandler(async (req, res, next) => {
  const username = req.query.username
  if (!username || typeof username !== 'string') {
    res.status(401).json({ isAvailable: false })
    return next()
  }
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })
  res.status(200).json({ isAvailable: !user })
})
