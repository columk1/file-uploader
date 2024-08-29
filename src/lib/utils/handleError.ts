import type { Request, Response } from 'express'

export const handleError = (err: Error, req: Request, res: Response) => {
  console.error(err)

  const error =
    req.app.get('env') === 'production'
      ? err
      : { status: 500, message: 'Oops! Something went wrong.' }
  res.status(err.status || 500)
  res.render('error', { error })
}
