import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { buildPage, toPagination } from '@/app/lib/api/pagination'
import { ok, fail } from '@/app/lib/api/respond'
import { AdminApplicationsQuerySchema } from '@/app/lib/api/schemas'
import { serializeApplication } from '@/app/lib/api/serialize'
import { parseQuery } from '@/app/lib/api/validation'
import { listApplications } from '@/app/lib/queries/applications'

export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const { page, pageSize, ...filters } = parseQuery(AdminApplicationsQuerySchema, req)
    const pagination = toPagination({ page, pageSize })

    const { rows, total } = await listApplications(filters, pagination)
    return ok(buildPage(
      rows.map(row => serializeApplication(row, { withLicenseUrl: true })),
      total,
      pagination
    ))
  } catch (e) {
    return fail(e)
  }
}
