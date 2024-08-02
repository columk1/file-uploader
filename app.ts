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
import multer from 'multer'

declare global {
  namespace Express {
    interface User {
      username: string
      id?: number | undefined
    }
  }
}

declare module 'express-session' {
  interface Session {
    messages?: string[]
  }
}

const PORT = process.env.PORT || 3000

const prisma = new PrismaClient()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.PG_URI,
})

const upload = multer({ dest: './public/data/uploads/' })

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

passport.deserializeUser(async (id: number, done) => {
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
  res.locals.currentUser = req.user
  next()
})

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) return next()
  res.redirect('/login')
}

const getPathSegments = async (entityId: number) => {
  const pathSegments: string[] = []

  async function buildPath(id: number) {
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: { parentFolder: true },
    })
    if (entity) {
      pathSegments.unshift(entity.name)
      if (entity.parentId) {
        await buildPath(entity.parentId)
      }
    }
  }
  await buildPath(entityId)
  return pathSegments
}

// TODO: Add params for filters
app.get('/', isAuthenticated, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.redirect('/login')
  const files = await prisma.entity.findMany({
    where: { userId: req.user?.id, parentId: null },
    orderBy: { type: 'asc' },
  })

  res.render('dashboard', { title: 'File Uploader', files })
})

app.get('/favicon.ico', (req, res) => res.status(204))

app.get('/:entityId', isAuthenticated, async (req: Request, res: Response) => {
  const id = Number(req.params.entityId)
  if (!id) return res.redirect('/')

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: { childEntities: true },
  })
  if (!entity) return res.status(404).send('Not found')

  const pathSegments = await getPathSegments(+req.params.entityId)
  console.log({ pathSegments })
  res.render('dashboard', {
    title: 'File Uploader',
    id,
    files: entity.childEntities,
    parentFolder: { name: 'root', id: entity.parentId },
    pathSegments,
  })
})

app.get('/sign-up', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/')
  res.render('sign-up', { title: 'Sign Up' })
})

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
  if (req.isAuthenticated()) return res.redirect('/')
  let usernameError, passwordError
  const { messages } = req.session
  console.log({ messages })
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
  console.log(req.session.messages)
  res.render('login', { title: 'Login', usernameError, passwordError })
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

app.post('/upload', isAuthenticated, upload.single('uploaded_file'), async (req, res) => {
  // req.file is the name of your file in the form, 'uploaded_file'
  if (!req.file) return res.status(400).send({ errors: [{ message: 'No file uploaded' }] })
  const { originalname, mimetype, size } = req.file

  const id = req.user?.id
  if (!id) return res.status(500).send({ errors: [{ message: 'Unauthorized' }] })

  const { path } = req.body

  // add to database using prisma
  const file = await prisma.entity.create({
    data: {
      type: 'FILE',
      name: originalname,
      mimeType: mimetype,
      size,
      userId: id,
      parentId: path ? +path : null,
    },
  })
  res.redirect(`/${path}`)

  console.log(req.file, req.body)
  console.log(file)
})

app.post('/new', async (req, res) => {
  const id = req.user?.id
  if (!id) return res.status(500).send({ errors: [{ message: 'Unauthorized' }] })

  const newFolder = await prisma.entity.create({
    data: {
      type: 'FOLDER',
      name: req.body.name || Date.now().toString(),
      userId: id,
      parentId: +req.body.parentId || null,
    },
  })
  console.log(newFolder)
  res.redirect('/')
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
