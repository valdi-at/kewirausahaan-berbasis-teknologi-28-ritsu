import 'server-only'
import { db, escapeLike } from '@/app/lib/db'
import { toInt, type BookingRow } from '@/app/lib/api/serialize'
import type { Pagination } from '@/app/lib/api/pagination'

const BOOKING_SELECT = `
  SELECT b.id, b.stage, b.pickup_location, b.destination, b.stops,
         b.distance, b.price, b.payment_status,
         b.driver_ready_at, b.delivery_start_time, b.delivery_end_time,
         b.created_at, b.updated_at,
         pm.id AS payment_method_id, pm.name AS payment_method_name,
         c.id  AS customer_id,       c.username AS customer_username,
         d.id  AS driver_id,         d.username AS driver_username`

const BOOKING_FROM = `
  FROM bookings b
  JOIN payment_methods pm ON pm.id = b.payment_method_id
  JOIN users c ON c.id = b.customer_id
  LEFT JOIN users d ON d.id = b.driver_id`

export type BookingSide = 'customer' | 'driver'

// Limit results to bookings where userId is on one side. null = all bookings (admin).
export type BookingScope = { side: BookingSide; userId: string } | null

export type BookingFilters = {
  stage?: number
  paid?: boolean
  paymentMethodId?: string
  from?: string
  to?: string
  q?: string
}

const SIDE_COLUMN: Record<BookingSide, string> = { customer: 'b.customer_id', driver: 'b.driver_id' }
// q matches the *other* party's username when scoped to one side.
const OTHER_PARTY_USERNAME: Record<BookingSide, string> = { customer: 'd.username', driver: 'c.username' }

function buildWhere(scope: BookingScope, filters: BookingFilters) {
  const conditions: string[] = []
  const params: unknown[] = []
  const param = (value: unknown) => {
    params.push(value)
    return `$${params.length}`
  }

  if (scope) conditions.push(`${SIDE_COLUMN[scope.side]} = ${param(scope.userId)}`)
  if (filters.stage !== undefined) conditions.push(`b.stage = ${param(filters.stage)}`)
  if (filters.paid !== undefined) conditions.push(`b.payment_status = ${param(filters.paid)}`)
  if (filters.paymentMethodId) conditions.push(`b.payment_method_id = ${param(filters.paymentMethodId)}`)
  if (filters.from) conditions.push(`b.created_at >= ${param(filters.from)}::timestamptz`)
  if (filters.to) conditions.push(`b.created_at < ${param(filters.to)}::timestamptz`)
  if (filters.q) {
    const pattern = param(`%${escapeLike(filters.q)}%`)
    const columns = [
      ...(scope ? [OTHER_PARTY_USERNAME[scope.side]] : ['c.username', 'd.username']),
      'b.pickup_location',
      'b.destination',
    ]
    conditions.push(`(${columns.map((col) => `${col} ILIKE ${pattern} ESCAPE '\\'`).join(' OR ')})`)
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params }
}

export async function listBookings(scope: BookingScope, filters: BookingFilters, { limit, offset }: Pagination) {
  const { where, params } = buildWhere(scope, filters)
  const n = params.length
  const [rows, count] = await Promise.all([
    db.query<BookingRow>(
      `${BOOKING_SELECT} ${BOOKING_FROM} ${where}
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, limit, offset]
    ),
    db.query<{ total: string }>(`SELECT COUNT(*) AS total ${BOOKING_FROM} ${where}`, params),
  ])
  return { rows: rows.rows, total: toInt(count.rows[0]?.total) }
}

// With participantId, only returns the booking if that user is its customer or driver.
export async function getBooking(id: string, participantId?: string): Promise<BookingRow | null> {
  const result = participantId
    ? await db.query<BookingRow>(
        `${BOOKING_SELECT} ${BOOKING_FROM} WHERE b.id = $1 AND (b.customer_id = $2 OR b.driver_id = $2)`,
        [id, participantId]
      )
    : await db.query<BookingRow>(`${BOOKING_SELECT} ${BOOKING_FROM} WHERE b.id = $1`, [id])
  return result.rows[0] ?? null
}
