import type { RequestHandler } from 'express'
import type { Prisma } from '@prisma/client'

export const handleSortQuery: RequestHandler = (req, res, next) => {
  const defaultSort = [{ type: 'asc' as 'asc' | 'desc' }]
  const sortQuery = req.query.sort

  if (!sortQuery) {
    req.sortCriteria = defaultSort
    return next()
  }
  const sortCriteria: Prisma.EntityOrderByWithRelationInput[] = defaultSort

  if (typeof sortQuery === 'string') {
    const getSortCriteria = (searchParams: string) =>
      searchParams.split(',').map((item) => {
        const direction = item.startsWith('-') ? 'desc' : 'asc'
        const field = direction === 'desc' ? item.slice(1) : item
        return { [field]: direction }
      })
    const additionalSort = getSortCriteria(sortQuery)
    sortCriteria.push(...additionalSort)
  }

  req.sortCriteria = sortCriteria
  next()
}
