import 'server-only'
import { db } from '@/app/lib/db'
import { toInt, type ApplicationRow } from '@/app/lib/api/serialize'
import type { Pagination } from '@/app/lib/api/pagination'

const APPLICATION_SELECT = `
  SELECT da.id, da.user_id, da.phone_number, da.status, da.admin_message,
         da.created_at, da.reviewed_at,
         u.username, u.email
  FROM driver_applications da
  JOIN users u ON da.user_id = u.id`

// Same order as app/admin/dashboard/applications/page.tsx: pending first, newest first.
export async function listApplications({ status }: { status?: string }, { limit, offset }: Pagination) {
  const [rows, count] = await Promise.all([
    db.query<ApplicationRow>(
      `${APPLICATION_SELECT}
       WHERE ($1::text IS NULL OR da.status = $1)
       ORDER BY
         CASE da.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         da.created_at DESC,
         da.id DESC
       LIMIT $2 OFFSET $3`,
      [status ?? null, limit, offset]
    ),
    db.query<{ total: string }>(
      'SELECT COUNT(*) AS total FROM driver_applications WHERE ($1::text IS NULL OR status = $1)',
      [status ?? null]
    ),
  ])
  return { rows: rows.rows, total: toInt(count.rows[0]?.total) }
}

export async function getApplication(id: string): Promise<ApplicationRow | null> {
  const result = await db.query<ApplicationRow>(`${APPLICATION_SELECT} WHERE da.id = $1`, [id])
  return result.rows[0] ?? null
}

export async function getLatestApplicationForUser(userId: string): Promise<ApplicationRow | null> {
  const result = await db.query<ApplicationRow>(
    `${APPLICATION_SELECT} WHERE da.user_id = $1 ORDER BY da.created_at DESC LIMIT 1`,
    [userId]
  )
  return result.rows[0] ?? null
}

// Stored path of the license image, e.g. /uploads/licenses/<file>. Never sent to clients.
export async function getApplicationLicensePath(id: string): Promise<string | null> {
  const result = await db.query<{ driving_license_image: string }>(
    'SELECT driving_license_image FROM driver_applications WHERE id = $1',
    [id]
  )
  return result.rows[0]?.driving_license_image ?? null
}
