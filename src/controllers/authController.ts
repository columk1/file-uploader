import asyncHandler from 'express-async-handler'
import passport from 'src/auth/passportConfig'
import prisma from 'src/prisma/prisma'
import bcrypt from 'bcrypt'

export const login = asyncHandler(async (req, res, next) => {
  // returns a middleware function which is immediately invoked with (req, res, next)
  passport.authenticate('local', {
    failureMessage: true,
    successRedirect: '/',
    failureRedirect: '/login',
  })(req, res, next)
})

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
  const hashedPassword = await bcrypt.hash(req.body.password, 10)
  try {
    await prisma.user.create({
      data: {
        username: req.body.username,
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
