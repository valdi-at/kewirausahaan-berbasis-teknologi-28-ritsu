import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { serializeUser } from '@/app/lib/api/serialize'

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser(req)
    return ok({ user: serializeUser(user) })
  } catch (e) {
    return fail(e)
  }
}
