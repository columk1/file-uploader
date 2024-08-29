import type { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err)

  const error =
    req.app.get('env') === 'production'
      ? err
      : { status: 500, message: 'Oops! Something went wrong.' }

  res.status(err.status || 500)
  res.render('error', { error })
}
