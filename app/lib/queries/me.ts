import 'server-only'
import { db } from '@/app/lib/db'
import { toInt, toNumber } from '@/app/lib/api/serialize'
import { listBookings, getBooking, type BookingSide, type BookingFilters } from '@/app/lib/queries/bookings'
import { getLatestApplicationForUser } from '@/app/lib/queries/applications'
import type { Pagination } from '@/app/lib/api/pagination'

// Per-user queries for /api/desktop/v1/me/*. Every query is filtered to the caller in SQL.

export type MeSummary = {
  as: BookingSide
  totalTrips: number
  completedTrips: number
  paidAmount: number
  unpaidCount: number
  unpaidAmount: number
  // 12 entries, oldest first, current month last. count = bookings created that
  // month, amount = price of those that are paid.
  monthly: { month: string; count: number; amount: number }[]
}

const SIDE_COLUMN: Record<BookingSide, string> = { customer: 'customer_id', driver: 'driver_id' }

export async function getMeSummary(userId: string, side: BookingSide): Promise<MeSummary> {
  const column = SIDE_COLUMN[side]
  const [totals, monthly] = await Promise.all([
    db.query<{
      total_trips: string
      completed_trips: string
      paid_amount: string
      unpaid_count: string
      unpaid_amount: string
    }>(
      `SELECT COUNT(*) AS total_trips,
              COUNT(*) FILTER (WHERE stage = 5) AS completed_trips,
              COALESCE(SUM(price) FILTER (WHERE payment_status = true), 0) AS paid_amount,
              COUNT(*) FILTER (WHERE payment_status = false AND stage >= 4) AS unpaid_count,
              COALESCE(SUM(price) FILTER (WHERE payment_status = false AND stage >= 4), 0) AS unpaid_amount
       FROM bookings
       WHERE ${column} = $1`,
      [userId]
    ),
    db.query<{ month: string; count: string; amount: string }>(
      `SELECT TO_CHAR(m.month, 'YYYY-MM') AS month,
              COUNT(b.id) AS count,
              COALESCE(SUM(b.price) FILTER (WHERE b.payment_status = true), 0) AS amount
       FROM generate_series(
              date_trunc('month', NOW()) - INTERVAL '11 months',
              date_trunc('month', NOW()),
              INTERVAL '1 month'
            ) AS m(month)
       LEFT JOIN bookings b
         ON b.${column} = $1 AND date_trunc('month', b.created_at) = m.month
       GROUP BY m.month
       ORDER BY m.month`,
      [userId]
    ),
  ])

  const t = totals.rows[0]
  return {
    as: side,
    totalTrips: toInt(t?.total_trips),
    completedTrips: toInt(t?.completed_trips),
    paidAmount: toNumber(t?.paid_amount),
    unpaidCount: toInt(t?.unpaid_count),
    unpaidAmount: toNumber(t?.unpaid_amount),
    monthly: monthly.rows.map(r => ({
      month: r.month,
      count: toInt(r.count),
      amount: toNumber(r.amount),
    })),
  }
}

export function listMyBookings(userId: string, side: BookingSide, filters: BookingFilters, pagination: Pagination) {
  return listBookings({ side, userId }, filters, pagination)
}

// null unless the caller is the booking's customer or driver
export function getMyBooking(userId: string, bookingId: string) {
  return getBooking(bookingId, userId)
}

export function getMyLatestApplication(userId: string) {
  return getLatestApplicationForUser(userId)
}
