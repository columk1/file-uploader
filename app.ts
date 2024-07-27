import express, { Request, Response } from 'express'
import 'dotenv/config.js'

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server')
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
