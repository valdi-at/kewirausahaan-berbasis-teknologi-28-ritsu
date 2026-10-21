import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiUser } from '@/app/lib/api/auth'
import { ApiError } from '@/app/lib/api/errors'
import { ok, noContent, fail } from '@/app/lib/api/respond'
import { ChangeRoleBodySchema } from '@/app/lib/api/schemas'
import { serializeApplication, serializeUser } from '@/app/lib/api/serialize'
import { parseBody, parseId } from '@/app/lib/api/validation'
import { getLatestApplicationForUser } from '@/app/lib/queries/applications'
import { getUserById } from '@/app/lib/queries/users'
import { changeUserRole, deleteUser, getUserDependencies } from '@/app/lib/services/admin'

type Context = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Context) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)

    const user = await getUserById(id)
    if (!user) throw new ApiError('NOT_FOUND', 'User not found.')

    const [dependencies, application] = await Promise.all([
      getUserDependencies(id),
      getLatestApplicationForUser(id),
    ])

    return ok({
      user: serializeUser(user),
      dependencies,
      latestApplication: application ? serializeApplication(application, { withLicenseUrl: true }) : null,
    })
  } catch (e) {
    return fail(e)
  }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const actor = await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)
    const { role } = await parseBody(ChangeRoleBodySchema, req)

    const user = await changeUserRole(actor.id, id, role)

    revalidatePath('/admin/dashboard/user')
    revalidatePath('/admin/dashboard')
    return ok({ user: serializeUser(user) })
  } catch (e) {
    return fail(e)
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    const actor = await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)

    await deleteUser(actor.id, id)

    revalidatePath('/admin/dashboard/user')
    revalidatePath('/admin/dashboard')
    return noContent()
  } catch (e) {
    return fail(e)
  }
}
