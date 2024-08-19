import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const checkPublicAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.entityId)
    if (!id) {
      return res.status(404).send('Not found')
    }

    // Fetch the file and its ancestors
    const fileWithAncestors = await prisma.entity.findMany({
      where: {
        OR: [{ id }, { parentId: id }],
      },
      include: {
        sharedFolders: {
          // Include shared folders info
          where: {
            expiresAt: {
              gte: new Date(), // Ensure the folder is not expired
            },
          },
        },
        parentFolder: {
          include: {
            sharedFolders: {
              // Include shared folders info for parent folders
              where: {
                expiresAt: {
                  gte: new Date(),
                },
              },
            },
          },
        },
      },
    })

    // Check if any folder in the hierarchy is shared
    const isPublic = fileWithAncestors.some(
      (entity) =>
        entity.sharedFolders.length > 0 ||
        (entity.parentFolder && entity.parentFolder.sharedFolders.length > 0)
    )

    if (!isPublic) {
      return res.status(403).send('Not authorized')
    }

    // req.body.userId = fileWithAncestors[0].userId

    next()
  } catch (err) {
    next(err)
  }
}
