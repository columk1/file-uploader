namespace Express {
  interface User {
    username: string
    id?: number | undefined
  }

  interface Session {
    messages?: string[]
  }
  interface Request {
    session: Session
    sortCriteria?: Prisma.EntityOrderByWithRelationInput[]
    entityId?: number
    sharedFolder?: Prisma.SharedFolder
  }
}

interface Error {
  name: string
  message: string
  stack?: string
  status?: number
}
