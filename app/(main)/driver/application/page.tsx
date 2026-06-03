import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import ApplicationForm from './ApplicationForm'

export const metadata: Metadata = { title: 'Driver Application - RITSU' }

type DriverApplication = {
  id: string
  status: string
  admin_message: string | null
  created_at: string
}

export default async function DriverApplicationPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  if (user.role === 'driver') {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center gap-4 py-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <div>
              <h1 className="text-xl font-bold">You&apos;re already a driver!</h1>
              <p className="text-sm text-base-content/60 mt-2">
                Your driver status is active. Head to your bookings to start accepting rides.
              </p>
            </div>
            <Link href="/driver/bookings" className="btn btn-primary">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (user.role === 'admin') {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center gap-2 py-12">
            <h1 className="text-xl font-bold">Not available</h1>
            <p className="text-sm text-base-content/60">Admin accounts cannot apply as drivers.</p>
          </div>
        </div>
      </div>
    )
  }

  const appResult = await db.query<DriverApplication>(
    'SELECT id, status, admin_message, created_at FROM driver_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [user.id]
  )
  const application = appResult.rows[0]

  if (application?.status === 'pending') {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center gap-4 py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
            <div>
              <h1 className="text-xl font-bold">Application Under Review</h1>
              <p className="text-sm text-base-content/60 mt-2 max-w-xs">
                We&apos;ve received your application and it&apos;s being reviewed by our team.
                You&apos;ll be notified once a decision is made.
              </p>
            </div>
            <p className="text-xs text-base-content/30">
              Applied on {new Date(application.created_at).toLocaleDateString('en-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-4">
      {application?.status === 'declined' && (
        <div role="alert" className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" suppressHydrationWarning>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="font-semibold">Your previous application was declined</div>
            {application.admin_message && (
              <div className="text-sm mt-0.5">Reason: {application.admin_message}</div>
            )}
            <div className="text-xs mt-1 opacity-70">You can reapply using the form below.</div>
          </div>
        </div>
      )}

      <ApplicationForm />
    </div>
  )
}
