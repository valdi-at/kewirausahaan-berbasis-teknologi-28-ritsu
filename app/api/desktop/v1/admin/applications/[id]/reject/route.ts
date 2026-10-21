import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { RejectBodySchema } from '@/app/lib/api/schemas'
import { serializeApplication } from '@/app/lib/api/serialize'
import { parseBody, parseId } from '@/app/lib/api/validation'
import { getApplication } from '@/app/lib/queries/applications'
import { rejectApplication } from '@/app/lib/services/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)
    const { reason } = await parseBody(RejectBodySchema, req)

    await rejectApplication(id, reason)

    revalidatePath('/admin/dashboard/applications')

    const application = await getApplication(id)
    return ok({ application: application && serializeApplication(application, { withLicenseUrl: true }) })
  } catch (e) {
    return fail(e)
  }
}
