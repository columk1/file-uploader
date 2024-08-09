import 'dotenv/config.js'
import express, { Request, Response, NextFunction } from 'express'
import prisma from 'src/db/prismaClient'
import session from 'express-session'
import passport from 'src/auth/passportConfig'
import path from 'path'
import morgan from 'morgan'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import multer from 'multer'
import authRouter from 'src/routers/authRouter'
import { formatDate } from 'src/lib/utils/formatDate'
import { Entity } from '@prisma/client'
import supabaseAdmin from 'src/db/supabaseAdminClient'
import { decode } from 'base64-arraybuffer'

const PORT = process.env.PORT || 3000

// const upload = multer({ dest: './public/data/uploads/' })
const upload = multer({ storage: multer.memoryStorage() })

const app = express()
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '../public')))
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
  const pathSegments: { id: number; name: string }[] = []

  async function buildPath(id: number) {
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: { parentFolder: true },
    })
    if (entity) {
      pathSegments.unshift({ id: entity.id, name: entity.name })
      if (entity.parentId) {
        await buildPath(entity.parentId)
      }
    }
  }
  await buildPath(entityId)
  return pathSegments
}

async function getFolderTree(
  userId: number | undefined,
  parentId: number | null
): Promise<Entity[]> {
  const entities = await prisma.entity.findMany({
    where: { userId, parentId, type: 'FOLDER' },
    orderBy: { type: 'asc' },
    include: { childEntities: true }, // Include child entities to build the tree
  })

  return Promise.all(
    entities.map(async (entity) => ({
      ...entity,
      childEntities: await getFolderTree(userId, entity.id), // Recursive call
    }))
  )
}

// TODO: Add params for filters
app.get('/', isAuthenticated, async (req: Request, res: Response) => {
  const files = await prisma.entity.findMany({
    where: { userId: req.user?.id, parentId: null },
    orderBy: { type: 'asc' },
  })

  const folders = await getFolderTree(req.user?.id, null)

  res.render('dashboard', {
    title: 'File Uploader',
    files,
    folders: folders,
    id: null,
    helpers: { formatDate },
  })
})

app.use(authRouter)

// GET: /:entityId (Dashboard)
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
  const folders = await getFolderTree(req.user?.id, null)

  res.render('dashboard', {
    title: 'File Uploader',
    id,
    name: entity.name,
    type: entity.type,
    files: entity.childEntities,
    parentFolder: { name: 'root', id: entity.parentId },
    pathSegments,
    folders,
    helpers: { formatDate },
  })
})

// POST: Upload a file
app.post('/upload', isAuthenticated, upload.single('uploaded_file'), async (req, res, next) => {
  try {
    const id = req.user?.id
    const file = req.file
    if (!id) return res.status(500).send({ errors: [{ message: 'Unauthorized' }] })

    // req.file is the name of the user's file in the form, 'uploaded_file'
    if (!file) return res.status(400).send({ errors: [{ message: 'No file uploaded' }] })
    console.log({ file })
    const { originalname, mimetype, size, buffer } = file
    const { path } = req.body

    const bucketName = 'files'
    const options = { contentType: mimetype }
    const filePath = `${id}/${originalname}`
    const fileBase64 = decode(buffer.toString('base64'))

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBase64, options)

    if (error) {
      console.log(error)
      // Todo: Fix typescript error
      if (error.statusCode === '409') {
        console.log('Duplicate')
        return res.redirect(`/${path}?error=${error.message}`)
      }
    }

    console.log({ data })

    const { data: uploadedData } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60)

    console.log({ uploadedData })

    // add to database using prisma
    const newFile = await prisma.entity.create({
      data: {
        type: 'FILE',
        name: originalname,
        mimeType: mimetype,
        size,
        userId: id,
        parentId: path ? +path : null,
        // url: uploadedData.publicUrl, // Could query using the userId + filename instead & generate signed URL when needed
      },
    })
    res.redirect(`/${path}`)
  } catch (error) {
    console.log(error)
  }
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
  res.redirect(`/${newFolder.id}`)
})

app.get('/download/:entityId', isAuthenticated, async (req, res) => {
  const file = `${__dirname}/../public/data/uploads/4f70cf55caa47c65fb3e47b43a42ef18`
  res.download(file)
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
