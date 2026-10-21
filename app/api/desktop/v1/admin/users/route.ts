import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { buildPage, toPagination } from '@/app/lib/api/pagination'
import { ok, fail } from '@/app/lib/api/respond'
import { AdminUsersQuerySchema } from '@/app/lib/api/schemas'
import { serializeUser } from '@/app/lib/api/serialize'
import { parseQuery } from '@/app/lib/api/validation'
import { listUsers } from '@/app/lib/queries/users'

export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const { page, pageSize, ...filters } = parseQuery(AdminUsersQuerySchema, req)
    const pagination = toPagination({ page, pageSize })

    const { rows, total } = await listUsers(filters, pagination)
    return ok(buildPage(rows.map(serializeUser), total, pagination))
  } catch (e) {
    return fail(e)
  }
}
