import type { Metadata } from 'next'
import { db } from '@/app/lib/db'

export const metadata: Metadata = { title: 'Dashboard - RITSU Admin' }

export default async function AdminDashboardPage() {
  const [userStats, appStats] = await Promise.all([
    db.query<{ role: string; count: string }>(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    ),
    db.query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) as count FROM driver_applications GROUP BY status'
    ),
  ])

  const roleMap = Object.fromEntries(userStats.rows.map(r => [r.role, parseInt(r.count)]))
  const appMap = Object.fromEntries(appStats.rows.map(r => [r.status, parseInt(r.count)]))
  const totalUsers = userStats.rows.reduce((sum, r) => sum + parseInt(r.count), 0)

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-base-content/50 text-sm mt-1">Overview of the RITSU platform</p>
      </div>

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

      <div className="mt-8 grid md:grid-cols-2 gap-4">
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
      </div>
    </div>
  )
}
