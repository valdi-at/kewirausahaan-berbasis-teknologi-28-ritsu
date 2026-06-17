import type { Metadata } from 'next'
import { db } from '@/app/lib/db'
import FinanceClient from './FinanceClient'

export const metadata: Metadata = { title: 'Finance - RITSU Admin' }

export default async function FinancePage() {
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
      `SELECT TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') AS month,
              COALESCE(SUM(price), 0) AS revenue,
              COUNT(*) AS count
       FROM bookings
       WHERE payment_status = true AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at) DESC`
    ),
    db.query<{ name: string; revenue: string; count: string }>(
      `SELECT pm.name,
              COALESCE(SUM(b.price), 0) AS revenue,
              COUNT(b.id) AS count
       FROM payment_methods pm
       LEFT JOIN bookings b ON b.payment_method_id = pm.id AND b.payment_status = true
       GROUP BY pm.id, pm.name
       ORDER BY revenue DESC`
    ),
    db.query<{ id: string; price: string; created_at: string; payment_method: string }>(
      `SELECT b.id, b.price,
              TO_CHAR(b.created_at, 'DD Mon YYYY') AS created_at,
              pm.name AS payment_method
       FROM bookings b
       LEFT JOIN payment_methods pm ON pm.id = b.payment_method_id
       WHERE b.payment_status = true
       ORDER BY b.created_at DESC
       LIMIT 10`
    ),
  ])

  const totalRevenue      = parseFloat(revenueAll.rows[0]?.revenue ?? '0')
  const totalCount        = parseInt(revenueAll.rows[0]?.count ?? '0')
  const monthRevenue      = parseFloat(revenueThisMonth.rows[0]?.revenue ?? '0')
  const monthCount        = parseInt(revenueThisMonth.rows[0]?.count ?? '0')
  const yearRevenue       = parseFloat(revenueThisYear.rows[0]?.revenue ?? '0')
  const outstandingAmount = parseFloat(outstanding.rows[0]?.amount ?? '0')
  const outstandingCount  = parseInt(outstanding.rows[0]?.count ?? '0')
  const avgPerBooking     = totalCount > 0 ? totalRevenue / totalCount : 0

  return (
    <FinanceClient
      data={{
        totalRevenue,
        totalCount,
        monthRevenue,
        monthCount,
        yearRevenue,
        outstandingAmount,
        outstandingCount,
        avgPerBooking,
        monthlyTrend: monthlyTrend.rows.map((r) => ({
          month: r.month,
          revenue: parseFloat(r.revenue),
          count: parseInt(r.count),
        })),
        paymentBreakdown: paymentBreakdown.rows.map((r) => ({
          name: r.name,
          revenue: parseFloat(r.revenue),
          count: parseInt(r.count),
        })),
        recentBookings: recentBookings.rows.map((r) => ({
          id: r.id,
          price: parseFloat(r.price),
          created_at: r.created_at,
          payment_method: r.payment_method,
        })),
      }}
    />
  )
}
