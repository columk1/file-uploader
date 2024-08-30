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

type PathSegmentEntity = Pick<Entity, 'id' | 'name' | 'parentId'> | null

export const getPathSegments = async (entityId?: number) => {
  if (!entityId) return []

  const pathSegments: { id: number; name: string }[] = []
  let currentId: number | null = entityId

  while (currentId) {
    const entity: PathSegmentEntity = await prisma.entity.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
    })
    if (entity) {
      pathSegments.unshift({ id: entity.id, name: entity.name })
      currentId = entity.parentId
    } else {
      currentId = null
    }
  }

  return pathSegments
}

type FolderTreeEntity = Pick<Entity, 'id' | 'name'> & {
  childEntities: FolderTreeEntity[] // Recursive type
}

export const getFolderTree = async (
  userId: number | undefined,
  parentId: number | null
): Promise<FolderTreeEntity[]> => {
  // Fetch all folders for the given user and parentId
  const allFolders = await prisma.entity.findMany({
    where: { userId, type: 'FOLDER' },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  })

  // Build a map for easy access
  const folderMap = new Map<number, FolderTreeEntity>()
  for (const folder of allFolders) {
    folderMap.set(folder.id, { id: folder.id, name: folder.name, childEntities: [] })
  }

  // Link child entities to their parents
  const folderTree: FolderTreeEntity[] = []
  for (const folder of allFolders) {
    const folderEntity = folderMap.get(folder.id)
    if (!folderEntity) continue

    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.childEntities.push(folderEntity)
      }
    } else {
      // This is a root folder
      folderTree.push(folderEntity)
    }
  }

  return folderTree
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
