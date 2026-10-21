import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { getAdminDashboardMetrics } from '@/app/lib/queries/admin-dashboard'

// Same numbers as /admin/dashboard on the web, from the same query module.
export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    return ok(await getAdminDashboardMetrics())
  } catch (e) {
    return fail(e)
  }
}
