import 'server-only'
import { db } from '@/app/lib/db'
import { toInt, toNumber } from '@/app/lib/api/serialize'

// Used by app/admin/dashboard/page.tsx and GET /api/desktop/v1/admin/dashboard,
// so both always show the same numbers. Don't change a metric's definition here
// without checking both.

export type PeriodVolume = { count: number; paidCount: number }

export type AdminDashboardMetrics = {
  totalUsers: number
  usersByRole: Record<string, number>
  applicationsByStatus: Record<string, number>
  revenue: { total: number; paidCount: number; average: number }
  outstanding: { amount: number; count: number }
  bookingVolume: { today: PeriodVolume; week: PeriodVolume; month: PeriodVolume }
  revenueByPaymentMethod: { id: string; name: string; iconLink: string; revenue: number; count: number }[]
  // day is YYYY-MM-DD in the database timezone, newest first, at most 14 rows
  dailyRevenue: { day: string; revenue: number; count: number }[]
  topDrivers: { id: string; username: string; totalEarned: number; bookingCount: number }[]
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const [
    userStats,
    appStats,
    revenueStats,
    paymentMethodRevenue,
    outstandingStats,
    bookingPeriods,
    avgBookingValue,
    dailyRevenue,
    topDrivers,
  ] = await Promise.all([
    db.query<{ role: string; count: string }>(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    ),
    db.query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) as count FROM driver_applications GROUP BY status'
    ),
    db.query<{ total_revenue: string; paid_count: string }>(
      `SELECT COALESCE(SUM(price), 0) as total_revenue, COUNT(*) as paid_count
       FROM bookings WHERE payment_status = true`
    ),
    db.query<{ id: string; name: string; icon_link: string; revenue: string; count: string }>(
      `SELECT pm.id, pm.name, pm.icon_link, COALESCE(SUM(b.price), 0) as revenue, COUNT(b.id) as count
       FROM payment_methods pm
       LEFT JOIN bookings b ON b.payment_method_id = pm.id AND b.payment_status = true
       GROUP BY pm.id, pm.name, pm.icon_link
       ORDER BY revenue DESC`
    ),
    db.query<{ outstanding_amount: string; outstanding_count: string }>(
      `SELECT COALESCE(SUM(price), 0) as outstanding_amount, COUNT(*) as outstanding_count
       FROM bookings WHERE payment_status = false AND stage >= 4`
    ),
    db.query<{ period: string; count: string; paid_count: string }>(
      `SELECT
         'today'   as period, COUNT(*) as count, COUNT(*) FILTER (WHERE payment_status = true) as paid_count FROM bookings WHERE created_at >= CURRENT_DATE
       UNION ALL
       SELECT 'week', COUNT(*), COUNT(*) FILTER (WHERE payment_status = true) FROM bookings WHERE created_at >= date_trunc('week', NOW())
       UNION ALL
       SELECT 'month', COUNT(*), COUNT(*) FILTER (WHERE payment_status = true) FROM bookings WHERE created_at >= date_trunc('month', NOW())`
    ),
    db.query<{ avg_value: string }>(
      `SELECT COALESCE(AVG(price), 0) as avg_value FROM bookings WHERE payment_status = true`
    ),
    db.query<{ day: string; revenue: string; count: string }>(
      `SELECT TO_CHAR(delivery_end_time::date, 'YYYY-MM-DD') as day,
              COALESCE(SUM(price), 0) as revenue,
              COUNT(*) as count
       FROM bookings
       WHERE payment_status = true AND delivery_end_time >= NOW() - INTERVAL '30 days'
       GROUP BY delivery_end_time::date
       ORDER BY delivery_end_time::date DESC
       LIMIT 14`
    ),
    db.query<{ driver_id: string; driver_name: string; total_earned: string; booking_count: string }>(
      `SELECT u.id as driver_id,
              u.username as driver_name,
              COALESCE(SUM(b.price), 0) as total_earned,
              COUNT(b.id) as booking_count
       FROM users u
       JOIN bookings b ON b.driver_id = u.id AND b.payment_status = true
       GROUP BY u.id, u.username
       ORDER BY total_earned DESC
       LIMIT 5`
    ),
  ])

  const usersByRole: Record<string, number> = { customer: 0, driver: 0, admin: 0 }
  for (const r of userStats.rows) usersByRole[r.role] = toInt(r.count)

  const applicationsByStatus: Record<string, number> = { pending: 0, approved: 0, declined: 0 }
  for (const r of appStats.rows) applicationsByStatus[r.status] = toInt(r.count)

  const period = (name: string): PeriodVolume => {
    const row = bookingPeriods.rows.find(r => r.period === name)
    return { count: toInt(row?.count), paidCount: toInt(row?.paid_count) }
  }

  return {
    totalUsers: userStats.rows.reduce((sum, r) => sum + toInt(r.count), 0),
    usersByRole,
    applicationsByStatus,
    revenue: {
      total: toNumber(revenueStats.rows[0]?.total_revenue),
      paidCount: toInt(revenueStats.rows[0]?.paid_count),
      average: toNumber(avgBookingValue.rows[0]?.avg_value),
    },
    outstanding: {
      amount: toNumber(outstandingStats.rows[0]?.outstanding_amount),
      count: toInt(outstandingStats.rows[0]?.outstanding_count),
    },
    bookingVolume: { today: period('today'), week: period('week'), month: period('month') },
    revenueByPaymentMethod: paymentMethodRevenue.rows.map(r => ({
      id: r.id,
      name: r.name,
      iconLink: r.icon_link,
      revenue: toNumber(r.revenue),
      count: toInt(r.count),
    })),
    dailyRevenue: dailyRevenue.rows.map(r => ({
      day: r.day,
      revenue: toNumber(r.revenue),
      count: toInt(r.count),
    })),
    topDrivers: topDrivers.rows.map(r => ({
      id: r.driver_id,
      username: r.driver_name,
      totalEarned: toNumber(r.total_earned),
      bookingCount: toInt(r.booking_count),
    })),
  }
}
