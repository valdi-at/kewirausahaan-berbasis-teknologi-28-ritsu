import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'

export const metadata: Metadata = { title: 'Bookings - RITSU' }

type Booking = {
  id: string
  pickup_location: string
  destination: string
  stage: number
  price: string
  created_at: string
}

const STAGE_INFO: Record<number, { label: string; cls: string }> = {
  1: { label: 'Finding driver',       cls: 'badge-warning'  },
  2: { label: 'Driver responding',    cls: 'badge-info'     },
  3: { label: 'Driver confirmed',     cls: 'badge-primary'  },
  4: { label: 'In transit',           cls: 'badge-primary'  },
}

function locationName(raw: string): string {
  try {
    const p = JSON.parse(raw)
    return p.name ?? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}`
  } catch {
    return raw
  }
}

export default async function BookingListPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role === 'driver') redirect('/driver/bookings')
  if (user.role === 'admin') redirect('/admin/dashboard')

  const result = await db.query<Booking>(
    `SELECT id, pickup_location, destination, stage, price, created_at
     FROM bookings
     WHERE customer_id = $1 AND stage BETWEEN 1 AND 4
     ORDER BY created_at DESC`,
    [user.id]
  )
  const bookings = result.rows

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Bookings</h1>
        <Link href="/booking/history" className="btn btn-ghost btn-sm">History</Link>
      </div>

      {bookings.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-12 gap-3">
            <span className="opacity-25">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <div>
              <p className="font-semibold">No active bookings</p>
              <p className="text-sm text-base-content/50 mt-1">Book your first ride below.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger">
          {bookings.map(b => {
            const from   = locationName(b.pickup_location)
            const to     = locationName(b.destination)
            const stage  = STAGE_INFO[b.stage] ?? { label: `Stage ${b.stage}`, cls: 'badge-ghost' }
            return (
              <Link
                key={b.id}
                href={`/booking/${b.id}`}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body gap-3 py-4">
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <span className="truncate font-medium">{from}</span>
                    </div>
                    <span className="ml-[5px] w-0.5 h-3 bg-base-300 rounded block" />
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm bg-secondary shrink-0" />
                      <span className="truncate font-medium">{to}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-base-200 pt-2.5">
                    <span className={`badge badge-sm ${stage.cls}`}>{stage.label}</span>
                    <span className="ml-auto text-xs text-base-content/50">
                      Rp {Number(b.price).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Link href="/booking/create" className="btn btn-primary btn-block shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Book a Ride
      </Link>

    </div>
  )
}
