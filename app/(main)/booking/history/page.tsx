import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'

export const metadata: Metadata = { title: 'Booking History - RITSU' }

type PastBooking = {
  id: string
  pickup_location: string
  destination: string
  price: string
  payment_status: boolean
  created_at: string
  payment_method_name: string
}

function locationName(raw: string): string {
  try {
    const p = JSON.parse(raw)
    return p.name ?? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}`
  } catch {
    return raw
  }
}

export default async function BookingHistoryPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'customer') redirect('/home')

  const result = await db.query<PastBooking>(
    `SELECT b.id, b.pickup_location, b.destination, b.price, b.payment_status, b.created_at,
            pm.name AS payment_method_name
     FROM bookings b
     JOIN payment_methods pm ON pm.id = b.payment_method_id
     WHERE b.customer_id = $1 AND b.stage = 5
     ORDER BY b.created_at DESC`,
    [user.id]
  )
  const bookings = result.rows

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">

      <div className="flex items-center gap-3">
        <Link href="/booking" className="btn btn-ghost btn-sm btn-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Booking History</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-12 gap-3">
            <span className="opacity-25">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <div>
              <p className="font-semibold">No past rides yet</p>
              <p className="text-sm text-base-content/50 mt-1">Your completed rides will appear here.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger">
          {bookings.map(b => {
            const from = locationName(b.pickup_location)
            const to   = locationName(b.destination)
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
                    <span className={`badge badge-sm ${b.payment_status ? 'badge-success' : 'badge-warning'}`}>
                      {b.payment_status ? 'Paid' : 'Unpaid'}
                    </span>
                    <span className="text-xs text-base-content/40">{b.payment_method_name}</span>
                    <span className="ml-auto text-xs font-medium">
                      Rp {Number(b.price).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <p className="text-xs text-base-content/40">
                    {new Date(b.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
