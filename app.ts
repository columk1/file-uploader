import 'dotenv/config.js'
import express, { Request, Response, NextFunction } from 'express'
import pg from 'pg'
import session from 'express-session'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

const PORT = process.env.PORT || 3000

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.PG_URI,
})

const app = express()
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server')
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).send({ errors: [{ message: 'Something went wrong' }] })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
