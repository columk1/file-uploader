import {
  getFolderEntityById,
  getFolderTree,
  getUserEntities,
  getPathSegments,
  getFolderContents,
} from 'src/entity/entities.repository'
import { Prisma } from '@prisma/client'
import createError from 'http-errors'

export const getRootFolderData = async (
  userId: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] | undefined
) => {
  // Fetch files and folders
  const files = await getUserEntities(userId, sortCriteria)
  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(userId, null)

  return { files, folders, sortQuery }
}

export const getFolderData = async (
  folderId: number,
  userId: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] | undefined
) => {
  const entity = await getFolderEntityById(folderId, sortCriteria)
  if (!entity) {
    throw new createError.NotFound()
  }

  const { name, childEntities: files, parentId } = entity
  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(userId, null)
  const pathSegments = await getPathSegments(folderId)

  return { name, files, folders, parentId, sortQuery, pathSegments }
}

export const getPublicFolderData = async (
  userId: number,
  rootFolderId: number,
  folderId: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] | undefined
) => {
  const files = await getFolderContents(folderId, sortCriteria)
  if (!files) {
    throw new createError.NotFound()
  }
  const folders = await getFolderTree(userId, rootFolderId)
  const pathSegments = await getPathSegments(folderId)
  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})

  return { files, folders, pathSegments, sortQuery }
}
