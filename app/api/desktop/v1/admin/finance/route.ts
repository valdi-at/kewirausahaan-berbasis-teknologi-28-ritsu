import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { toIso } from '@/app/lib/api/serialize'
import { getFinanceMetrics } from '@/app/lib/queries/finance'

// Same numbers as /admin/dashboard/finance on the web, from the same query module.
export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const { recentPaidBookings, ...metrics } = await getFinanceMetrics()
    return ok({
      ...metrics,
      recentPaidBookings: recentPaidBookings.map(b => ({
        id: b.id,
        price: b.price,
        createdAt: toIso(b.createdAt),
        paymentMethod: b.paymentMethod,
      })),
    })
  } catch (e) {
    return fail(e)
  }
}
