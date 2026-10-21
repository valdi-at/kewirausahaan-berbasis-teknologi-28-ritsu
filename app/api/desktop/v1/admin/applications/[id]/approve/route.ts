import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiUser } from '@/app/lib/api/auth'
import { ok, fail } from '@/app/lib/api/respond'
import { serializeApplication } from '@/app/lib/api/serialize'
import { parseId } from '@/app/lib/api/validation'
import { getApplication } from '@/app/lib/queries/applications'
import { approveApplication } from '@/app/lib/services/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)

    await approveApplication(id)

    revalidatePath('/admin/dashboard/applications')
    revalidatePath('/admin/dashboard')

    const application = await getApplication(id)
    return ok({ application: application && serializeApplication(application, { withLicenseUrl: true }) })
  } catch (e) {
    return fail(e)
  }
}
