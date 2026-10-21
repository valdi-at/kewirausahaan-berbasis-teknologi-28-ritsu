import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { noContent, fail } from '@/app/lib/api/respond'

// Tokens are stateless for now, so this only confirms the token was valid.
// The client throws its token away either way.
export async function POST(req: NextRequest) {
  try {
    await requireApiUser(req)
    return noContent()
  } catch (e) {
    return fail(e)
  }
}
