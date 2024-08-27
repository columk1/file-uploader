import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import session from 'express-session'
import prisma from 'src/database/prismaClient'

const sessionConfig = session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // ms
  },
  secret: process.env.SESSION_SECRET || 'pickle rick',
  resave: false,
  saveUninitialized: true,
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000, //ms
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
})

export default sessionConfig
