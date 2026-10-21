import 'server-only'
import * as z from 'zod'
import { db, withTransaction } from '@/app/lib/db'
import { ServiceError } from '@/app/lib/services/errors'
import { toInt, type UserRow } from '@/app/lib/api/serialize'

// Admin write rules, shared by app/actions/admin.ts and the desktop API.

export const USER_ROLES = ['customer', 'driver', 'admin'] as const

export type UserDependencies = {
  bookingsAsCustomer: number
  bookingsAsDriver: number
  chatMessages: number
}

const isUuid = (id: string) => z.uuid().safeParse(id).success
// Postgres accepts upper-case UUIDs, so compare IDs case-insensitively.
const sameId = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export async function getUserDependencies(userId: string): Promise<UserDependencies> {
  const result = await db.query<{ bookings_as_customer: string; bookings_as_driver: string; chat_messages: string }>(
    `SELECT
       (SELECT COUNT(*) FROM bookings WHERE customer_id = $1)    AS bookings_as_customer,
       (SELECT COUNT(*) FROM bookings WHERE driver_id = $1)      AS bookings_as_driver,
       (SELECT COUNT(*) FROM chat_messages WHERE sender_id = $1) AS chat_messages`,
    [userId]
  )
  const row = result.rows[0]
  return {
    bookingsAsCustomer: toInt(row?.bookings_as_customer),
    bookingsAsDriver: toInt(row?.bookings_as_driver),
    chatMessages: toInt(row?.chat_messages),
  }
}

function dependenciesError(deps: UserDependencies) {
  const parts = [
    deps.bookingsAsCustomer > 0 && `${deps.bookingsAsCustomer} booking(s) as customer`,
    deps.bookingsAsDriver > 0 && `${deps.bookingsAsDriver} booking(s) as driver`,
    deps.chatMessages > 0 && `${deps.chatMessages} chat message(s)`,
  ].filter(Boolean)
  return new ServiceError(
    'HAS_DEPENDENCIES',
    `This user has ${parts.join(', ') || 'linked records'} and cannot be deleted.`,
    deps
  )
}

export async function changeUserRole(actorId: string, targetId: string, role: string): Promise<UserRow> {
  if (!(USER_ROLES as readonly string[]).includes(role)) {
    throw new ServiceError('VALIDATION_ERROR', 'Invalid role.')
  }
  if (!isUuid(targetId)) throw new ServiceError('NOT_FOUND', 'User not found.')
  if (sameId(actorId, targetId)) {
    throw new ServiceError('SELF_ACTION_FORBIDDEN', 'You cannot change your own role.')
  }

  const result = await db.query<UserRow>(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, username, email, role, created_at, updated_at`,
    [role, targetId]
  )
  const user = result.rows[0]
  if (!user) throw new ServiceError('NOT_FOUND', 'User not found.')
  return user
}

export async function deleteUser(actorId: string, targetId: string): Promise<void> {
  if (!isUuid(targetId)) throw new ServiceError('NOT_FOUND', 'User not found.')
  if (sameId(actorId, targetId)) {
    throw new ServiceError('SELF_ACTION_FORBIDDEN', 'You cannot delete your own account.')
  }

  const deps = await getUserDependencies(targetId)
  if (deps.bookingsAsCustomer + deps.bookingsAsDriver + deps.chatMessages > 0) {
    throw dependenciesError(deps)
  }

  let rowCount: number | null
  try {
    rowCount = (await db.query('DELETE FROM users WHERE id = $1', [targetId])).rowCount
  } catch (e) {
    // 23503 = foreign_key_violation, a booking or message was added after the count above
    if ((e as { code?: string }).code === '23503') {
      throw dependenciesError(await getUserDependencies(targetId))
    }
    throw e
  }
  if (!rowCount) throw new ServiceError('NOT_FOUND', 'User not found.')
}

// Called when a pending-only UPDATE touched no rows.
async function notPendingError(applicationId: string) {
  const existing = await db.query<{ status: string }>(
    'SELECT status FROM driver_applications WHERE id = $1',
    [applicationId]
  )
  const status = existing.rows[0]?.status
  if (!status) return new ServiceError('NOT_FOUND', 'Application not found.')
  return new ServiceError('ALREADY_REVIEWED', 'This application has already been reviewed.', { status })
}

export async function approveApplication(applicationId: string): Promise<void> {
  if (!isUuid(applicationId)) throw new ServiceError('NOT_FOUND', 'Application not found.')

  await withTransaction(async (client) => {
    const result = await client.query<{ user_id: string }>(
      `UPDATE driver_applications SET status = 'approved', reviewed_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING user_id`,
      [applicationId]
    )
    const application = result.rows[0]
    if (!application) throw await notPendingError(applicationId)

    await client.query(
      "UPDATE users SET role = 'driver', updated_at = NOW() WHERE id = $1",
      [application.user_id]
    )
  })
}

export async function rejectApplication(applicationId: string, reason: string): Promise<void> {
  const trimmed = typeof reason === 'string' ? reason.trim() : ''
  if (!trimmed) throw new ServiceError('VALIDATION_ERROR', 'Rejection reason is required.')
  if (!isUuid(applicationId)) throw new ServiceError('NOT_FOUND', 'Application not found.')

  const result = await db.query(
    `UPDATE driver_applications SET status = 'declined', admin_message = $2, reviewed_at = NOW()
     WHERE id = $1 AND status = 'pending'`,
    [applicationId, trimmed]
  )
  if (!result.rowCount) throw await notPendingError(applicationId)
}
