import passport from 'passport'
import localStrategy from '../auth/strategies/local'
import prisma from 'src/database/prismaClient'

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
