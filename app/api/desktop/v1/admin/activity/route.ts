import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { ActivityQuerySchema } from '@/app/lib/api/schemas'
import { parseQuery } from '@/app/lib/api/validation'
import { getRecentActivity } from '@/app/lib/queries/activity'

export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const { limit } = parseQuery(ActivityQuerySchema, req)
    return ok({ items: await getRecentActivity(limit) })
  } catch (e) {
    return fail(e)
  }
}
