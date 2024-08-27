import type { ErrorRequestHandler } from 'express'
import { handleError } from '@/lib/utils/handleError'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => handleError(err, req, res)
