import passport from 'passport'
import prisma from '@/database/prismaClient'
import localStrategy from '@/auth/strategies/local'

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
