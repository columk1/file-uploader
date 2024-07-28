import 'dotenv/config.js'
import express, { Request, Response, NextFunction } from 'express'
import pg from 'pg'
import session from 'express-session'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import path from 'path'
import morgan from 'morgan'

const PORT = process.env.PORT || 3000

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

passport.use(
  new LocalStrategy(async (username, password, done) => {
    console.log('New Local Strategy')
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
      const user = rows[0]

      if (!user) {
        console.log('Incorrect username')
        return done(null, false, { message: 'Username not found' })
      }
      // const match = await bcrypt.compare(password, user.password)
      if (user.password !== password) {
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
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    const user = rows[0]

    done(null, user)
  } catch (err) {
    done(err)
  }
})

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server')
})

app.get('/sign-up', (req, res) => res.render('sign-up'))
app.post('/sign-up', async (req, res, next) => {
  try {
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [
      req.body.username,
      req.body.password,
    ])
    res.redirect('/')
  } catch (err) {
    console.log(err)
    return next(err)
  }
})
app.get('/login', (req, res) => res.render('login'))
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).send({ errors: [{ message: 'Not found' }] })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).send({ errors: [{ message: 'Something went wrong' }] })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
