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
  }
}

// declare module 'express-session' {
//   interface Session {
//     messages?: string[]
//   }
// }
