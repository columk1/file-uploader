import { PrismaClient } from '@prisma/client'
import pg from 'pg'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => new PrismaClient()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.PG_URI,
})

const prisma = globalThis.prisma ?? prismaClientSingleton()

// Prevent multiple instances of Prisma Client in development (hot reloading can create new instances)
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma
