import { Strategy as LocalStrategy } from 'passport-local'
import prisma from 'src/prisma/prisma'
import bcrypt from 'bcrypt'

export default new LocalStrategy(async (username, password, done) => {
  console.log('New Local Strategy')
  try {
    const user = await prisma.user.findFirst({ where: { username } })
    if (!user) {
      console.log('Incorrect username')
      return done(null, false, { message: 'Username not found' })
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      console.log('Incorrect password')
      return done(null, false, { message: 'Incorrect password' })
    }
    console.log('Found user')
    return done(null, user)
  } catch (err) {
    return done(err)
  }
})
