import type { Entity, Prisma } from '@prisma/client'
import prisma from '@/database/prismaClient'

export const getUserEntities = async (
  userId: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] = []
) => {
  return prisma.entity.findMany({
    where: { userId, parentId: null },
    orderBy: sortCriteria,
  })
}

export const getEntityById = async (id: number) => prisma.entity.findUnique({ where: { id } })

export const getFileById = async (id: number) =>
  prisma.entity.findUnique({ where: { id, type: 'FILE' } })

export const getFolderById = async (id: number) =>
  prisma.entity.findUnique({ where: { id, type: 'FOLDER' } })

export const getFolderContents = async (
  parentId: number | null,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] = []
) => {
  return prisma.entity.findMany({
    where: { parentId },
    orderBy: sortCriteria,
  })
}

export const getFolderEntityById = async (
  id: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] = []
) => {
  return prisma.entity.findUnique({
    where: { id, type: 'FOLDER' },
    include: {
      childEntities: {
        orderBy: sortCriteria,
      },
    },
  })
}

export const createFolder = async (userId: number, parentId: number | null, name: string) => {
  return prisma.entity.create({
    data: {
      type: 'FOLDER',
      name,
      parentId,
      userId,
    },
  })
}

export const createFile = async (
  name: string,
  mimetype: string,
  size: number,
  userId: number,
  parentId: number | null
) => {
  return prisma.entity.create({
    data: {
      type: 'FILE',
      name,
      mimeType: mimetype,
      size,
      parentId,
      userId,
    },
  })
}

export const deleteEntityById = async (id: number) => {
  return prisma.entity.delete({
    where: {
      id,
    },
  })
}

// Unused function
export const getOwnerIdByEntityId = async (id: number) => {
  return prisma.entity.findUnique({ where: { id } }).then((entity) => entity?.userId)
}

export const createSharedFolder = async (userId: number, folderId: number, expiresAt: Date) => {
  return prisma.sharedFolder.create({
    data: {
      userId,
      folderId,
      expiresAt,
    },
  })
}

export const getSharedFolderById = async (id: string) => {
  return prisma.sharedFolder.findUnique({
    where: { id },
    include: { folder: true },
  })
}

export const isChildOf = async (parentId: number, childId: number) => {
  let currentFolder = await prisma.entity.findUnique({
    where: { id: childId },
    select: { id: true, parentId: true },
  })

  // Traverse up the hierarchy until we either find the sharedFolderId or reach the root
  while (currentFolder) {
    if (currentFolder.id === parentId) {
      return true
    }
    if (!currentFolder.parentId) {
      break
    }
    currentFolder = await prisma.entity.findUnique({
      where: { id: currentFolder.parentId },
      select: { id: true, parentId: true },
    })
  }

  return false
}

export const getPathSegments = async (entityId?: number) => {
  const pathSegments: { id: number; name: string }[] = []
  if (!entityId) return pathSegments

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

export const getFolderTree = async (
  userId: number | undefined,
  parentId: number | null
): Promise<FolderTreeEntity[]> => {
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

export const getFilename = async (entityId: number) => {
  return prisma.entity.findUnique({ where: { id: entityId } }).then((entity) => entity?.name)
}

export const getAllFilenames = async (userId: number, parentId: number) => {
  const entities = await prisma.entity.findMany({
    where: { userId, parentId },
    select: {
      id: true,
      type: true,
      name: true,
    },
  })

  const filenames: string[] = []

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
