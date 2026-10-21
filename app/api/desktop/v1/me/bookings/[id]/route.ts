import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ApiError } from '@/app/lib/api/errors'
import { ok, fail } from '@/app/lib/api/respond'
import { serializeBooking } from '@/app/lib/api/serialize'
import { parseId } from '@/app/lib/api/validation'
import { getMyBooking } from '@/app/lib/queries/me'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(req)
    const id = parseId((await params).id)

    // Someone else's booking is a 404, same as one that doesn't exist.
    const booking = await getMyBooking(user.id, id)
    if (!booking) throw new ApiError('NOT_FOUND', 'Booking not found.')

    return ok({ booking: serializeBooking(booking) })
  } catch (e) {
    return fail(e)
  }
}
