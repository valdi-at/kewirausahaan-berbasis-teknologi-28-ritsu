import type { Metadata } from 'next'
import { db } from '@/app/lib/db'

export const metadata: Metadata = { title: 'Dashboard - RITSU Admin' }

export default async function AdminDashboardPage() {
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
    db.query<{ name: string; icon_link: string; revenue: string; count: string }>(
      `SELECT pm.name, pm.icon_link, COALESCE(SUM(b.price), 0) as revenue, COUNT(b.id) as count
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
      `SELECT TO_CHAR(delivery_end_time::date, 'Mon DD') as day,
              COALESCE(SUM(price), 0) as revenue,
              COUNT(*) as count
       FROM bookings
       WHERE payment_status = true AND delivery_end_time >= NOW() - INTERVAL '30 days'
       GROUP BY delivery_end_time::date
       ORDER BY delivery_end_time::date DESC
       LIMIT 14`
    ),
    db.query<{ driver_name: string; total_earned: string; booking_count: string }>(
      `SELECT u.username as driver_name,
              COALESCE(SUM(b.price), 0) as total_earned,
              COUNT(b.id) as booking_count
       FROM users u
       JOIN bookings b ON b.driver_id = u.id AND b.payment_status = true
       GROUP BY u.id, u.username
       ORDER BY total_earned DESC
       LIMIT 5`
    ),
  ])

  const roleMap = Object.fromEntries(userStats.rows.map(r => [r.role, parseInt(r.count)]))
  const appMap = Object.fromEntries(appStats.rows.map(r => [r.status, parseInt(r.count)]))
  const totalUsers = userStats.rows.reduce((sum, r) => sum + parseInt(r.count), 0)

  const totalRevenue = parseFloat(revenueStats.rows[0]?.total_revenue ?? '0')
  const paidCount = parseInt(revenueStats.rows[0]?.paid_count ?? '0')
  const outstandingAmount = parseFloat(outstandingStats.rows[0]?.outstanding_amount ?? '0')
  const outstandingCount = parseInt(outstandingStats.rows[0]?.outstanding_count ?? '0')
  const avgValue = parseFloat(avgBookingValue.rows[0]?.avg_value ?? '0')

  const periodMap = Object.fromEntries(bookingPeriods.rows.map(r => [r.period, r]))

  const totalPaymentRevenue = paymentMethodRevenue.rows.reduce((s, r) => s + parseFloat(r.revenue), 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const statCards = [
    { label: 'Total Users', value: totalUsers, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Customers', value: roleMap['customer'] ?? 0, color: 'text-base-content', bg: 'bg-base-300/60' },
    { label: 'Active Drivers', value: roleMap['driver'] ?? 0, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Admins', value: roleMap['admin'] ?? 0, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Pending Applications', value: appMap['pending'] ?? 0, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Approved Applications', value: appMap['approved'] ?? 0, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Declined Applications', value: appMap['declined'] ?? 0, color: 'text-error', bg: 'bg-error/10' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-base-content/50 text-sm mt-1">Overview of the RITSU platform</p>
      </div>

      {/* User & Application Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className="card bg-base-100 shadow-sm">
            <div className="card-body p-5 gap-2">
              <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">{label}</p>
              <div className={`flex items-center justify-center h-12 w-12 rounded-2xl ${bg}`}>
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-success mt-2">{fmt(totalRevenue)}</p>
              <p className="text-xs text-base-content/40 mt-1">{paidCount} paid bookings</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Outstanding (Unpaid)</p>
              <p className="text-2xl font-bold text-error mt-2">{fmt(outstandingAmount)}</p>
              <p className="text-xs text-base-content/40 mt-1">{outstandingCount} completed but unpaid</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Avg. Booking Value</p>
              <p className="text-2xl font-bold text-primary mt-2">{fmt(avgValue)}</p>
              <p className="text-xs text-base-content/40 mt-1">across paid bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Volume */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Booking Volume</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['today', 'week', 'month'] as const).map(period => {
            const row = periodMap[period]
            const count = parseInt(row?.count ?? '0')
            const paid = parseInt(row?.paid_count ?? '0')
            const label = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'
            return (
              <div key={period} className="card bg-base-100 shadow-sm">
                <div className="card-body p-5">
                  <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold mt-2">{count}</p>
                  <div className="flex gap-3 mt-2 text-xs text-base-content/50">
                    <span className="text-success">{paid} paid</span>
                    <span className="text-warning">{count - paid} unpaid</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* User & App breakdowns + Payment Method Revenue */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Users by Role</h2>
            <div className="mt-2 space-y-3">
              {(['customer', 'driver', 'admin'] as const).map(role => {
                const count = roleMap[role] ?? 0
                const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
                const color = role === 'driver' ? 'progress-success' : role === 'admin' ? 'progress-warning' : 'progress-primary'
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{role}</span>
                      <span className="text-base-content/50">{count}</span>
                    </div>
                    <progress className={`progress ${color} w-full`} value={pct} max={100} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Applications by Status</h2>
            <div className="mt-2 space-y-3">
              {(['pending', 'approved', 'declined'] as const).map(status => {
                const count = appMap[status] ?? 0
                const total = Object.values(appMap).reduce((s, v) => s + v, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const color = status === 'approved' ? 'progress-success' : status === 'declined' ? 'progress-error' : 'progress-warning'
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-base-content/50">{count}</span>
                    </div>
                    <progress className={`progress ${color} w-full`} value={pct} max={100} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Revenue by Payment Method</h2>
            <div className="mt-2 space-y-3">
              {paymentMethodRevenue.rows.map(pm => {
                const revenue = parseFloat(pm.revenue)
                const pct = totalPaymentRevenue > 0 ? Math.round((revenue / totalPaymentRevenue) * 100) : 0
                return (
                  <div key={pm.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{pm.name}</span>
                      <span className="text-base-content/50">{fmt(revenue)}</span>
                    </div>
                    <progress className="progress progress-primary w-full" value={pct} max={100} />
                    <p className="text-xs text-base-content/40 mt-0.5">{pm.count} transactions</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Revenue + Top Drivers */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Revenue Over Time (Last 30 Days)</h2>
            {dailyRevenue.rows.length === 0 ? (
              <p className="text-sm text-base-content/40 mt-4">No data yet.</p>
            ) : (
              <div className="mt-2 overflow-auto max-h-64">
                <table className="table table-xs w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Trips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRevenue.rows.map(row => (
                      <tr key={row.day}>
                        <td className="font-medium">{row.day}</td>
                        <td className="text-right text-success">{fmt(parseFloat(row.revenue))}</td>
                        <td className="text-right text-base-content/50">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Top Earning Drivers</h2>
            {topDrivers.rows.length === 0 ? (
              <p className="text-sm text-base-content/40 mt-4">No data yet.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {topDrivers.rows.map((driver, i) => (
                  <div key={driver.driver_name} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-base-300 flex items-center justify-center text-xs font-bold text-base-content/60">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{driver.driver_name}</p>
                      <p className="text-xs text-base-content/40">{driver.booking_count} trips</p>
                    </div>
                    <span className="text-sm font-semibold text-success flex-shrink-0">{fmt(parseFloat(driver.total_earned))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
