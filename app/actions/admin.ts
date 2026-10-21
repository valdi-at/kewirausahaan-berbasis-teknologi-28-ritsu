'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/app/lib/dal'
import * as admin from '@/app/lib/services/admin'
import { ServiceError } from '@/app/lib/services/errors'

async function verifyAdmin() {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/home')
  return user
}

// Domain errors become { error }, anything else still throws.
async function run(fn: () => Promise<unknown>): Promise<{ error?: string }> {
  try {
    await fn()
    return {}
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message }
    throw e
  }
}

export async function updateUserRole(userId: string, role: string): Promise<{ error?: string }> {
  const actor = await verifyAdmin()
  const result = await run(() => admin.changeUserRole(actor.id, userId, role))
  if (result.error) return result
  revalidatePath('/admin/dashboard/user')
  revalidatePath('/admin/dashboard')
  return {}
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const actor = await verifyAdmin()
  const result = await run(() => admin.deleteUser(actor.id, userId))
  if (result.error) return result
  revalidatePath('/admin/dashboard/user')
  revalidatePath('/admin/dashboard')
  return {}
}

export async function acceptApplication(applicationId: string): Promise<{ error?: string }> {
  await verifyAdmin()
  const result = await run(() => admin.approveApplication(applicationId))
  if (result.error) return result
  revalidatePath('/admin/dashboard/applications')
  revalidatePath('/admin/dashboard')
  return {}
}

export async function rejectApplication(applicationId: string, reason: string): Promise<{ error?: string }> {
  await verifyAdmin()
  const result = await run(() => admin.rejectApplication(applicationId, reason))
  if (result.error) return result
  revalidatePath('/admin/dashboard/applications')
  return {}
}
