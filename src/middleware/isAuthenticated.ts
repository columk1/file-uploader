import type { RequestHandler } from 'express'

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next()
  res.redirect('/login')
}
