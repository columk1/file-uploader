import type { Request, Response } from 'express'

export const handleError = (err: Error, req: Request, res: Response) => {
  console.error(err)

  const error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.render('error', { error })
}
