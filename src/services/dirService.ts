import prisma from 'src/db/prismaClient'
import { Entity } from '@prisma/client'

async function getPathSegments(entityId: number) {
  const pathSegments: { id: number; name: string }[] = []

  async function buildPath(id: number) {
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: { parentFolder: true },
    })
    if (entity) {
      pathSegments.unshift({ id: entity.id, name: entity.name })
      if (entity.parentId) {
        await buildPath(entity.parentId)
      }
    }
  }
  await buildPath(entityId)
  return pathSegments
}

type FolderTreeEntity = Pick<Entity, 'id' | 'name'> & {
  childEntities: FolderTreeEntity[] // Recursive type
}

async function getFolderTree(
  userId: number | undefined,
  parentId: number | null
): Promise<FolderTreeEntity[]> {
  const entities = await prisma.entity.findMany({
    where: { userId, parentId, type: 'FOLDER' },
    orderBy: { type: 'asc' },
    select: {
      id: true,
      name: true,
      // include child entities to build the tree
      childEntities: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return Promise.all(
    entities.map(async (entity) => ({
      ...entity,
      childEntities: await getFolderTree(userId, entity.id),
    }))
  )
}

async function getAllFilenames(userId: number, parentId: number) {
  const entities = await prisma.entity.findMany({
    where: { userId, parentId },
    select: {
      id: true,
      type: true,
      name: true,
    },
  })

  let filenames: string[] = []

  for (const entity of entities) {
    if (entity.type === 'FILE') {
      filenames.push(entity.name)
    } else if (entity.type === 'FOLDER') {
      const childFilenames = await getAllFilenames(userId, entity.id)
      filenames.push(...childFilenames)
    }
  }
  return filenames
}

export { getPathSegments, getFolderTree, getAllFilenames }
