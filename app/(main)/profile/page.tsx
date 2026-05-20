import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { logout } from '@/app/actions/auth'

export const metadata: Metadata = { title: 'Profile - RITSU' }

const roleBadge: Record<string, string> = {
  admin:    'badge-neutral',
  driver:   'badge-primary',
  customer: 'badge-secondary',
}

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const initials = user.username.slice(0, 2).toUpperCase()
  const badgeClass = roleBadge[user.role] ?? 'badge-ghost'
  const isCustomer = user.role === 'customer'

  return (
    <div className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-4">

      {/* ── Avatar + name ── */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body items-center text-center gap-3">
          <div className="avatar avatar-placeholder">
            <div className="bg-primary text-primary-content w-20 rounded-full shadow-lg shadow-primary/30">
              <span className="text-2xl font-bold">{initials}</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.username}</h1>
            <p className="text-sm text-base-content/50">{user.email}</p>
          </div>
          <span className={`badge badge-lg ${badgeClass} capitalize`}>{user.role}</span>
        </div>
      </div>

      {/* ── Account details ── */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <h2 className="text-sm font-semibold text-base-content/60 px-6 pt-5 pb-2">Account Details</h2>
          <div className="divider my-0" />
          {[
            { label: 'Username', value: user.username },
            { label: 'Email',    value: user.email },
            { label: 'Role',     value: user.role },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-base-content/50">{label}</span>
                <span className="text-sm font-medium capitalize">{value}</span>
              </div>
              {i < arr.length - 1 && <div className="divider my-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Driver application ── */}
      {isCustomer && (
        <div className="card bg-gradient-to-br from-primary/10 to-secondary/20 shadow-sm border border-primary/20">
          <div className="card-body gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </span>
              <h2 className="card-title text-base">Become a Driver</h2>
            </div>
            <p className="text-sm text-base-content/60 leading-relaxed">
              Earn income by giving rides around campus. Upload a photo of your driving license to apply.
            </p>
            <div className="card-actions">
              <Link href="/profile/apply-driver" className="btn btn-primary btn-sm">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Session / logout ── */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <h2 className="text-sm font-semibold text-base-content/60 px-6 pt-5 pb-2">Session</h2>
          <div className="divider my-0" />
          <div className="px-4 py-3">
            <form action={logout}>
              <button type="submit" className="btn btn-ghost btn-block text-error justify-between">
                Sign Out
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  )
}
