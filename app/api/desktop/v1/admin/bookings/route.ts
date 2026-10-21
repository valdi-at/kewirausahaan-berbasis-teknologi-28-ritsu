import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { buildPage, toPagination } from '@/app/lib/api/pagination'
import { ok, fail } from '@/app/lib/api/respond'
import { AdminBookingsQuerySchema } from '@/app/lib/api/schemas'
import { serializeBooking } from '@/app/lib/api/serialize'
import { parseQuery } from '@/app/lib/api/validation'
import { listBookings } from '@/app/lib/queries/bookings'

export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const { page, pageSize, ...filters } = parseQuery(AdminBookingsQuerySchema, req)
    const pagination = toPagination({ page, pageSize })

    const { rows, total } = await listBookings(null, filters, pagination)
    return ok(buildPage(rows.map(serializeBooking), total, pagination))
  } catch (e) {
    return fail(e)
  }
}
