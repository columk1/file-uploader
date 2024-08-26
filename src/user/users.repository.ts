import prisma from 'src/database/prismaClient'

export const findUserByUsername = async (username: string) =>
  prisma.user.findUnique({
    where: {
      username,
    },
  })

export const createUser = async (username: string, password: string) =>
  prisma.user.create({
    data: {
      username,
      password,
    },
  })
