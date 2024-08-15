import { Request, Response } from 'express'
import { getFolderTree, getPathSegments } from 'src/services/dirService'
import prisma from 'src/db/prismaClient'
import helpers from 'src/lib/utils/ejsHelpers'

const getDashboard = async (req: Request, res: Response) => {
  const { sortCriteria } = req

  const files = await prisma.entity.findMany({
    where: { userId: req.user?.id, parentId: null },
    orderBy: sortCriteria,
  })

  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(req.user?.id, null)
  console.log({ folders })

  res.render('dashboard', {
    title: 'File Uploader',
    files,
    folders,
    id: null,
    parentId: null,
    sortQuery,
    helpers,
  })
}

// GET: /:entityId (Same view as Dashboard)
const getEntityById = async (req: Request, res: Response) => {
  const id = Number(req.params.entityId)

  const { sortCriteria } = req

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: {
      childEntities: {
        orderBy: sortCriteria,
      },
    },
  })
  if (!entity) return res.status(404).send('Not found')

  const { name, type, childEntities: files, parentId } = entity
  const sortQuery = sortCriteria?.reduce((acc, curr) => ({ ...acc, ...curr }), {})
  const folders = await getFolderTree(req.user?.id, null)
  const pathSegments = await getPathSegments(id)

  res.render('dashboard', {
    title: 'File Uploader',
    id,
    name,
    type,
    files,
    parentId,
    pathSegments,
    folders,
    sortQuery,
    helpers,
  })
}

export { getDashboard, getEntityById }
