import * as z from 'zod'

export const PaginationSchema = z.object({
  page: z.coerce
    .number({ error: 'page must be a number.' })
    .int({ error: 'page must be an integer.' })
    .min(1, { error: 'page must be at least 1.' })
    .default(1),
  pageSize: z.coerce
    .number({ error: 'pageSize must be a number.' })
    .int({ error: 'pageSize must be an integer.' })
    .min(1, { error: 'pageSize must be at least 1.' })
    .max(100, { error: 'pageSize must be at most 100.' })
    .default(25),
})

export type Pagination = {
  page: number
  pageSize: number
  limit: number
  offset: number
}

export type Page<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export function toPagination({ page, pageSize }: { page: number; pageSize: number }): Pagination {
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize }
}

export function buildPage<T>(items: T[], total: number, { page, pageSize }: Pagination): Page<T> {
  return { items, page, pageSize, total }
}
