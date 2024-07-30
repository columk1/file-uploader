import 'dotenv/config.js'
import express, { Request, Response, NextFunction } from 'express'
import pg from 'pg'
import session from 'express-session'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import path from 'path'
import morgan from 'morgan'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const PORT = process.env.PORT || 3000

const prisma = new PrismaClient()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.PG_URI,
})

const app = express()
const __dirname = import.meta.dirname
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
)

declare global {
  namespace Express {
    interface User {
      username: string
      id?: number | undefined
    }
  }
}

passport.use(
  new LocalStrategy(async (username, password, done) => {
    console.log('New Local Strategy')
    try {
      const user = await prisma.user.findFirst({ where: { username } })
      if (!user) {
        console.log('Incorrect username')
        return done(null, false, { message: 'Username not found' })
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        console.log('Incorrect password')
        return done(null, false, { message: 'Incorrect password' })
      }
      console.log('Found user')
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })

    done(null, user)
  } catch (err) {
    done(err)
  }
})

app.use(passport.session())
app.use(passport.initialize())

// Add the current logged in user to res.locals
app.use((req, res, next) => {
  console.log(req.user)
  res.locals.currentUser = req.user
  next()
})

app.get('/', (req: Request, res: Response) => {
  res.render('home', { title: 'File Uploader' })
})

app.get('/sign-up', (req, res) => res.render('sign-up', { title: 'Sign Up' }))

app.post('/sign-up', async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
      },
    })
    res.redirect('/')
  } catch (err) {
    console.log(err)
    return next(err)
  }
})
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', errors: req.session.messages })
  req.session.messages = undefined
})

app.post(
  '/login',
  passport.authenticate('local', {
    failureMessage: true,
    successRedirect: '/',
    failureRedirect: '/login',
  })
)

app.get('/logout', (req, res, next) => {
  req.logout((err) => (err ? next(err) : res.redirect('/')))
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).send({ errors: [{ message: 'Not found' }] })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).send({ errors: [{ message: 'Something went wrong' }] })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
