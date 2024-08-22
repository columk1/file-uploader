import 'dotenv/config.js'
import express, { Request, Response, NextFunction } from 'express'
import sessionConfig from 'src/config/sessionConfig'
import passport from 'src/auth/passportConfig'
import path from 'path'
import morgan from 'morgan'
import authRouter from 'src/routers/authRouter'
import entityRouter from 'src/routers/entityRouter'
import compression from 'compression'
import createError from 'http-errors'

const PORT = process.env.PORT || 3000

const app = express()
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '../public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(compression())
app.use(morgan('dev'))
app.use(sessionConfig)

app.use(passport.session())
app.use(passport.initialize())

// Add the current logged in user to res.locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user
  next()
})

app.use(authRouter)
app.use(entityRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const error = req.app.get('env') === 'development' ? err : {}
  console.log(err)
  res.status(err.status || 500)
  res.render('error', { error })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
