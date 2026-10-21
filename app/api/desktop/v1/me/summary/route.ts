import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { MeSummaryQuerySchema } from '@/app/lib/api/schemas'
import { parseQuery } from '@/app/lib/api/validation'
import { getMeSummary } from '@/app/lib/queries/me'

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser(req)
    const query = parseQuery(MeSummaryQuerySchema, req)
    const side = query.as ?? (user.role === 'driver' ? 'driver' : 'customer')
    return ok(await getMeSummary(user.id, side))
  } catch (e) {
    return fail(e)
  }
}
