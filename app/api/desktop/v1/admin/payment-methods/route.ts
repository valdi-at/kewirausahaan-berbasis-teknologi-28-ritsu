import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { serializePaymentMethod } from '@/app/lib/api/serialize'
import { listPaymentMethods } from '@/app/lib/queries/payment-methods'

export async function GET(req: NextRequest) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const methods = await listPaymentMethods()
    return ok({ items: methods.map(serializePaymentMethod) })
  } catch (e) {
    return fail(e)
  }
}
