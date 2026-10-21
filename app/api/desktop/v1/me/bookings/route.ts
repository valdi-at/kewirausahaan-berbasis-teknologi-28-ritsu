import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { buildPage, toPagination } from '@/app/lib/api/pagination'
import { ok, fail } from '@/app/lib/api/respond'
import { MeBookingsQuerySchema } from '@/app/lib/api/schemas'
import { serializeBooking } from '@/app/lib/api/serialize'
import { parseQuery } from '@/app/lib/api/validation'
import { listMyBookings } from '@/app/lib/queries/me'

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser(req)
    const { as, page, pageSize, ...filters } = parseQuery(MeBookingsQuerySchema, req)
    const side = as ?? (user.role === 'driver' ? 'driver' : 'customer')
    const pagination = toPagination({ page, pageSize })

    const { rows, total } = await listMyBookings(user.id, side, filters, pagination)
    return ok(buildPage(rows.map(serializeBooking), total, pagination))
  } catch (e) {
    return fail(e)
  }
}
