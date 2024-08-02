import passport from 'passport'
import localStrategy from './strategies/local'
import prisma from '../prisma/prisma'

const configurePassport = () => {
  passport.use(localStrategy)

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } })
      done(null, user)
    } catch (err) {
      done(err)
    }
  })
}

configurePassport()

export default passport
