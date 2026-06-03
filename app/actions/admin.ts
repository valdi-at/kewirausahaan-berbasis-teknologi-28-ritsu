'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/app/lib/db'
import { getUser } from '@/app/lib/dal'

async function verifyAdmin() {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/home')
  return user
}

export async function updateUserRole(userId: string, role: string): Promise<{ error?: string }> {
  await verifyAdmin()
  const validRoles = ['customer', 'driver', 'admin']
  if (!validRoles.includes(role)) return { error: 'Invalid role.' }
  await db.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId])
  revalidatePath('/admin/dashboard/user')
  revalidatePath('/admin/dashboard')
  return {}
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  await verifyAdmin()
  await db.query('DELETE FROM users WHERE id = $1', [userId])
  revalidatePath('/admin/dashboard/user')
  revalidatePath('/admin/dashboard')
  return {}
}

export async function acceptApplication(applicationId: string): Promise<{ error?: string }> {
  await verifyAdmin()
  const result = await db.query<{ user_id: string }>(
    'SELECT user_id FROM driver_applications WHERE id = $1',
    [applicationId]
  )
  if (!result.rows[0]) return { error: 'Application not found.' }
  const { user_id } = result.rows[0]
  await db.query(
    "UPDATE driver_applications SET status = 'approved', reviewed_at = NOW() WHERE id = $1",
    [applicationId]
  )
  await db.query(
    "UPDATE users SET role = 'driver', updated_at = NOW() WHERE id = $1",
    [user_id]
  )
  revalidatePath('/admin/dashboard/applications')
  revalidatePath('/admin/dashboard')
  return {}
}

export async function rejectApplication(applicationId: string, reason: string): Promise<{ error?: string }> {
  await verifyAdmin()
  if (!reason.trim()) return { error: 'Rejection reason is required.' }
  await db.query(
    "UPDATE driver_applications SET status = 'declined', admin_message = $2, reviewed_at = NOW() WHERE id = $1",
    [applicationId, reason.trim()]
  )
  revalidatePath('/admin/dashboard/applications')
  return {}
}
