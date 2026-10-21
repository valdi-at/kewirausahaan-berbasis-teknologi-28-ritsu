import 'server-only'
import { db, escapeLike } from '@/app/lib/db'
import { toInt, type UserRow } from '@/app/lib/api/serialize'
import type { Pagination } from '@/app/lib/api/pagination'

export async function listUsers(
  { q, role }: { q?: string; role?: string },
  { limit, offset }: Pagination
) {
  const pattern = q ? `%${escapeLike(q)}%` : null
  const where = `
    WHERE ($1::text IS NULL OR username ILIKE $1 ESCAPE '\\' OR email ILIKE $1 ESCAPE '\\')
      AND ($2::text IS NULL OR role = $2)`
  const [rows, count] = await Promise.all([
    db.query<UserRow>(
      `SELECT id, username, email, role, created_at, updated_at FROM users ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $3 OFFSET $4`,
      [pattern, role ?? null, limit, offset]
    ),
    db.query<{ total: string }>(`SELECT COUNT(*) AS total FROM users ${where}`, [pattern, role ?? null]),
  ])
  return { rows: rows.rows, total: toInt(count.rows[0]?.total) }
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const result = await db.query<UserRow>(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
    [id]
  )
  return result.rows[0] ?? null
}
