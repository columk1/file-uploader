import type { Prisma } from '@prisma/client'
import createError from 'http-errors'
import {
  getFolderContents,
  getFolderEntityById,
  getFolderTree,
  getPathSegments,
  getUserEntities,
} from '@/entity/entities.repository'

const getSortQuery = (sortCriteria: Prisma.EntityOrderByWithRelationInput[] | undefined) => {
  return sortCriteria?.reduce((acc, curr) => Object.assign(acc, curr), {})
}

export const getRootFolderData = async (
  userId: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] | undefined
) => {
  // Fetch files and folders
  const entities = await getUserEntities(userId, sortCriteria)
  if (!entities) {
    throw new createError.NotFound()
  }
  // Generate sort query
  const sortQuery = getSortQuery(sortCriteria)
  // Get complete folder tree for sidebar
  const folders = await getFolderTree(userId, null)
  // Get path segments for breadcrumb
  const pathSegments = await getPathSegments()

  return { files: entities, folders, parentId: null, sortQuery, pathSegments }
}

export const getFolderData = async (
  folderId: number,
  userId: number,
  sortCriteria: Prisma.EntityOrderByWithRelationInput[] | undefined
) => {
  const folder = await getFolderEntityById(folderId, sortCriteria)
  if (!folder) {
    throw new createError.NotFound()
  }

  const { childEntities, parentId } = folder
  const sortQuery = getSortQuery(sortCriteria)
  const folders = await getFolderTree(userId, null)
  const pathSegments = await getPathSegments(folderId)

  return { files: childEntities, folders, parentId, sortQuery, pathSegments }
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
  const sortQuery = getSortQuery(sortCriteria)

  return { files, folders, pathSegments, sortQuery }
}
