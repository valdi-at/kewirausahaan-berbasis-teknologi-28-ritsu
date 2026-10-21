import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ApiError } from '@/app/lib/api/errors'
import { ok, fail } from '@/app/lib/api/respond'
import { serializeBooking } from '@/app/lib/api/serialize'
import { parseId } from '@/app/lib/api/validation'
import { getBooking } from '@/app/lib/queries/bookings'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)

    const booking = await getBooking(id)
    if (!booking) throw new ApiError('NOT_FOUND', 'Booking not found.')

    return ok({ booking: serializeBooking(booking) })
  } catch (e) {
    return fail(e)
  }
}
