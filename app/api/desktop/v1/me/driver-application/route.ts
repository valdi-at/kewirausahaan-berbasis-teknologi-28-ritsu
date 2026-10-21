import { NextRequest } from 'next/server'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { serializeApplication } from '@/app/lib/api/serialize'
import { getMyLatestApplication } from '@/app/lib/queries/me'

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser(req)
    const application = await getMyLatestApplication(user.id)
    return ok({
      application: application ? serializeApplication(application, { withLicenseUrl: false }) : null,
    })
  } catch (e) {
    return fail(e)
  }
}
