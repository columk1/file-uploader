// change alias from './src' to './dist' in production
if (process.env.NODE_ENV === 'production') require('module-alias/register')

import 'dotenv/config.js'
import path from 'node:path'
import compression from 'compression'
import express, { type Request, type Response } from 'express'
import createError from 'http-errors'
import methodOverride from 'method-override'
import morgan from 'morgan'
import authRouter from '@/auth/auth.router'
import passport from '@/config/passportConfig'
import sessionConfig from '@/config/sessionConfig'
import fileRouter from '@/entity/file/files.router'
import folderRouter from '@/entity/folder/folders.router'
import { isAuthenticated } from '@/middleware/isAuthenticated'
import terminate from './lib/utils/terminate'
import { errorHandler } from '@/middleware/errorHandler'
import publicRouter from '@/public/public.router'
import shareRouter from '@/share/share.router'
import helmet from 'helmet'

const PORT = process.env.PORT || 3000

const app = express()
app.use(helmet())
app.use(compression())
app.set('views', `${__dirname}/views`)
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1 day' }))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(morgan('dev'))
app.use(sessionConfig)
app.use(methodOverride('_method'))

app.use(passport.session())
app.use(passport.initialize())

// Add the current logged in user to res.locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user
  next()
})

app.use(authRouter)
app.get('/', (req: Request, res: Response) => res.redirect('/folders'))
app.use('/files', isAuthenticated, fileRouter)
app.use('/folders', isAuthenticated, folderRouter)
app.use('/share', isAuthenticated, shareRouter)
app.use('/public', publicRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)))

app.use(errorHandler)

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`))

const exitHandler = terminate(server, { coredump: false, timeout: 500 })

process.on('uncaughtException', exitHandler(1, 'Unexpected Error'))
process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'))
process.on('SIGTERM', exitHandler(0, 'SIGTERM'))
process.on('SIGINT', exitHandler(0, 'SIGINT'))
