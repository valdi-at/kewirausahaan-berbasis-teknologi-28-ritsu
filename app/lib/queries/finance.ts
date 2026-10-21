import 'server-only'
import { db } from '@/app/lib/db'
import { toInt, toNumber } from '@/app/lib/api/serialize'

// Used by app/admin/dashboard/finance/page.tsx and GET /api/desktop/v1/admin/finance.
// Note the monthly trend groups by created_at (not delivery_end_time like the
// dashboard's daily revenue). Keep it that way, the desktop app matches the web.

export type FinanceMetrics = {
  allTime: { revenue: number; count: number }
  thisMonth: { revenue: number; count: number }
  thisYear: { revenue: number; count: number }
  outstanding: { amount: number; count: number }
  averagePerBooking: number
  // month is YYYY-MM in the database timezone, newest first
  monthlyTrend: { month: string; revenue: number; count: number }[]
  paymentBreakdown: { id: string; name: string; revenue: number; count: number }[]
  // createdDate is created_at as YYYY-MM-DD in the database timezone
  recentPaidBookings: {
    id: string
    price: number
    createdAt: Date
    createdDate: string
    paymentMethod: string | null
  }[]
}

export async function getFinanceMetrics(): Promise<FinanceMetrics> {
  const [
    revenueAll,
    revenueThisMonth,
    revenueThisYear,
    outstanding,
    monthlyTrend,
    paymentBreakdown,
    recentBookings,
  ] = await Promise.all([
    db.query<{ revenue: string; count: string }>(
      `SELECT COALESCE(SUM(price), 0) AS revenue, COUNT(*) AS count
       FROM bookings WHERE payment_status = true`
    ),
    db.query<{ revenue: string; count: string }>(
      `SELECT COALESCE(SUM(price), 0) AS revenue, COUNT(*) AS count
       FROM bookings
       WHERE payment_status = true AND created_at >= date_trunc('month', NOW())`
    ),
    db.query<{ revenue: string; count: string }>(
      `SELECT COALESCE(SUM(price), 0) AS revenue, COUNT(*) AS count
       FROM bookings
       WHERE payment_status = true AND created_at >= date_trunc('year', NOW())`
    ),
    db.query<{ amount: string; count: string }>(
      `SELECT COALESCE(SUM(price), 0) AS amount, COUNT(*) AS count
       FROM bookings WHERE payment_status = false AND stage >= 4`
    ),
    db.query<{ month: string; revenue: string; count: string }>(
      `SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
              COALESCE(SUM(price), 0) AS revenue,
              COUNT(*) AS count
       FROM bookings
       WHERE payment_status = true AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at) DESC`
    ),
    db.query<{ id: string; name: string; revenue: string; count: string }>(
      `SELECT pm.id,
              pm.name,
              COALESCE(SUM(b.price), 0) AS revenue,
              COUNT(b.id) AS count
       FROM payment_methods pm
       LEFT JOIN bookings b ON b.payment_method_id = pm.id AND b.payment_status = true
       GROUP BY pm.id, pm.name
       ORDER BY revenue DESC`
    ),
    db.query<{ id: string; price: string; created_at: Date; created_date: string; payment_method: string | null }>(
      `SELECT b.id, b.price, b.created_at,
              TO_CHAR(b.created_at, 'YYYY-MM-DD') AS created_date,
              pm.name AS payment_method
       FROM bookings b
       LEFT JOIN payment_methods pm ON pm.id = b.payment_method_id
       WHERE b.payment_status = true
       ORDER BY b.created_at DESC
       LIMIT 10`
    ),
  ])

  const allTime = {
    revenue: toNumber(revenueAll.rows[0]?.revenue),
    count: toInt(revenueAll.rows[0]?.count),
  }

  return {
    allTime,
    thisMonth: {
      revenue: toNumber(revenueThisMonth.rows[0]?.revenue),
      count: toInt(revenueThisMonth.rows[0]?.count),
    },
    thisYear: {
      revenue: toNumber(revenueThisYear.rows[0]?.revenue),
      count: toInt(revenueThisYear.rows[0]?.count),
    },
    outstanding: {
      amount: toNumber(outstanding.rows[0]?.amount),
      count: toInt(outstanding.rows[0]?.count),
    },
    averagePerBooking: allTime.count > 0 ? allTime.revenue / allTime.count : 0,
    monthlyTrend: monthlyTrend.rows.map(r => ({
      month: r.month,
      revenue: toNumber(r.revenue),
      count: toInt(r.count),
    })),
    paymentBreakdown: paymentBreakdown.rows.map(r => ({
      id: r.id,
      name: r.name,
      revenue: toNumber(r.revenue),
      count: toInt(r.count),
    })),
    recentPaidBookings: recentBookings.rows.map(r => ({
      id: r.id,
      price: toNumber(r.price),
      createdAt: r.created_at,
      createdDate: r.created_date,
      paymentMethod: r.payment_method,
    })),
  }
}
