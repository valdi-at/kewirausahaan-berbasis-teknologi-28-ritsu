import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import AvailableBookingCard from './AvailableBookingCard'

export const metadata: Metadata = { title: 'My Bookings - RITSU' }

type AvailableBooking = {
  id: string
  pickup_location: string
  destination: string
  price: string
  distance: string
  customer_username: string
  created_at: string
}

type ActiveBooking = {
  id: string
  pickup_location: string
  destination: string
  price: string
  distance: string
  stage: number
  payment_status: boolean
  driver_ready_at: string | null
  customer_username: string
  created_at: string
}

const STAGE_LABELS: Record<number, { label: string; cls: string }> = {
  2: { label: 'Waiting for customer', cls: 'badge-warning' },
  3: { label: 'Heading to pickup',    cls: 'badge-info'    },
  4: { label: 'In transit',           cls: 'badge-primary' },
}

export default async function DriverBookingsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'driver') redirect('/home')

  const [availableResult, activeResult] = await Promise.all([
    db.query<AvailableBooking>(
      `SELECT b.id, b.pickup_location, b.destination, b.price, b.distance, b.created_at,
              u.username AS customer_username
       FROM bookings b
       JOIN users u ON u.id = b.customer_id
       WHERE b.stage = 1 AND b.driver_id IS NULL
       ORDER BY b.created_at ASC`
    ),
    db.query<ActiveBooking>(
      `SELECT b.id, b.pickup_location, b.destination, b.price, b.distance,
              b.stage, b.payment_status, b.driver_ready_at, b.created_at,
              u.username AS customer_username
       FROM bookings b
       JOIN users u ON u.id = b.customer_id
       WHERE b.driver_id = $1 AND b.stage BETWEEN 2 AND 4
       ORDER BY b.created_at DESC`,
      [user.id]
    ),
  ])

  const available = availableResult.rows
  const active    = activeResult.rows

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-8">

      {/* Available Rides */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Available Rides</h2>
          <span className="badge badge-ghost badge-sm">{available.length}</span>
        </div>

        {available.length === 0 ? (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body items-center text-center py-10 gap-2">
              <span className="text-3xl opacity-30">🚗</span>
              <p className="text-sm text-base-content/50">No rides available right now. Check back soon.</p>
            </div>
          </div>
        ) : (
          available.map(b => <AvailableBookingCard key={b.id} booking={b} />)
        )}
      </section>

      {/* My Active Bookings */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">My Active Bookings</h2>
          <span className="badge badge-ghost badge-sm">{active.length}</span>
        </div>

        {active.length === 0 ? (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body items-center text-center py-10 gap-2">
              <span className="text-3xl opacity-30">📋</span>
              <p className="text-sm text-base-content/50">No active bookings yet. Accept a ride above.</p>
            </div>
          </div>
        ) : (
          active.map(b => {
            const stageInfo = STAGE_LABELS[b.stage] ?? { label: `Stage ${b.stage}`, cls: 'badge-ghost' }
            return (
              <div key={b.id} className="card bg-base-100 shadow-sm">
                <div className="card-body gap-3 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" suppressHydrationWarning>
                            <circle cx="12" cy="12" r="6" />
                          </svg>
                        </span>
                        <span className="truncate font-medium">{b.pickup_location}</span>
                      </div>
                      <div className="ml-2.5 border-l-2 border-dashed border-base-300 pl-4 text-xs text-base-content/50">↓</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" suppressHydrationWarning>
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span className="truncate font-medium">{b.destination}</span>
                      </div>
                    </div>

                    <Link href={`/driver/booking/${b.id}`} className="btn btn-outline btn-sm shrink-0">
                      Details
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-base-200 pt-2.5">
                    <span className={`badge badge-sm ${stageInfo.cls}`}>{stageInfo.label}</span>
                    {b.payment_status && (
                      <span className="badge badge-success badge-sm">Paid</span>
                    )}
                    <span className="ml-auto text-xs text-base-content/50">
                      {b.customer_username} · Rp {Number(b.price).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </section>

    </div>
  )
}
