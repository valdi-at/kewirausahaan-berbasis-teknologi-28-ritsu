import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import StageButton from './StageButton'
import LocationBeacon from './LocationBeacon'
import { startTrip, completeTrip, markPaid } from '@/app/actions/booking'

export const metadata: Metadata = { title: 'Ride - RITSU' }

type Booking = {
  id: string
  pickup_location: string
  destination: string
  stage: number
  price: string
  distance: string
  payment_status: boolean
  driver_ready_at: string | null
  delivery_start_time: string | null
  delivery_end_time: string | null
  created_at: string
  customer_username: string
  payment_method_name: string
}

const STAGE_INFO: Record<number, { label: string; cls: string; desc: string }> = {
  2: { label: 'Waiting for customer',  cls: 'badge-warning', desc: 'Customer has not confirmed yet.'               },
  3: { label: 'Heading to pickup',     cls: 'badge-info',    desc: 'Customer confirmed. Head to the pickup point.' },
  4: { label: 'In transit',            cls: 'badge-primary', desc: 'Trip is in progress.'                          },
  5: { label: 'Completed',             cls: 'badge-success', desc: 'Ride completed.'                               },
}

function locationName(raw: string): string {
  try {
    const p = JSON.parse(raw)
    return p.name ?? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}`
  } catch {
    return raw
  }
}

export default async function DriverBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'driver') redirect('/home')

  const { id } = await params

  const result = await db.query<Booking>(
    `SELECT b.id, b.pickup_location, b.destination, b.stage,
            b.price, b.distance, b.payment_status,
            b.driver_ready_at, b.delivery_start_time, b.delivery_end_time,
            b.created_at,
            u.username AS customer_username,
            pm.name AS payment_method_name
     FROM bookings b
     JOIN users u ON u.id = b.customer_id
     JOIN payment_methods pm ON pm.id = b.payment_method_id
     WHERE b.id = $1 AND b.driver_id = $2`,
    [id, user.id]
  )

  const booking = result.rows[0]
  if (!booking) redirect('/driver/bookings')

  const from  = locationName(booking.pickup_location)
  const to    = locationName(booking.destination)
  const stage = STAGE_INFO[booking.stage] ?? { label: `Stage ${booking.stage}`, cls: 'badge-ghost', desc: '' }
  const isCash = booking.payment_method_name === 'Cash'

  return (
    <div className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-4">

      {(booking.stage === 3 || booking.stage === 4) && <LocationBeacon />}

      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/driver/bookings" className="btn btn-ghost btn-sm btn-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Ride</h1>
        <span className={`badge badge-sm ml-1 ${stage.cls}`}>{stage.label}</span>
      </div>

      {/* Stage description */}
      {stage.desc && (
        <p className="text-sm text-base-content/50 px-1">{stage.desc}</p>
      )}

      {/* Customer + route */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-4 py-5">

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-base-content/50">Customer</p>
              <p className="font-semibold">{booking.customer_username}</p>
            </div>
          </div>

          <div className="divider my-0" />

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0891b2] shrink-0" />
              <div>
                <p className="text-xs text-base-content/50 mb-0.5">Pickup</p>
                <p className="font-medium leading-snug">{from}</p>
              </div>
            </div>
            <span className="ml-[4px] w-0.5 h-4 bg-base-300 rounded block" />
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 rounded-sm bg-[#ca8a04] shrink-0" />
              <div>
                <p className="text-xs text-base-content/50 mb-0.5">Destination</p>
                <p className="font-medium leading-snug">{to}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-0 py-0 px-0">
          {([
            ['Distance', `${Number(booking.distance).toFixed(1)} km`],
            ['Price',    `Rp ${Number(booking.price).toLocaleString('id-ID')}`],
            ['Payment',  `${booking.payment_method_name} · ${booking.payment_status ? 'Paid' : 'Unpaid'}`],
          ] as [string, string][]).map(([label, value], i, arr) => (
            <div key={label}>
              <div className="flex justify-between items-center px-5 py-3.5 text-sm">
                <span className="text-base-content/50">{label}</span>
                <span className={`font-medium ${label === 'Payment' && !booking.payment_status ? 'text-warning' : ''}`}>
                  {value}
                </span>
              </div>
              {i < arr.length - 1 && <div className="divider my-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stage controls */}
      <div className="flex flex-col gap-2">
        {booking.stage === 3 && (
          <StageButton
            bookingId={booking.id}
            action={startTrip}
            label="Start Trip"
            cls="btn-primary"
          />
        )}

        {booking.stage === 4 && (
          <StageButton
            bookingId={booking.id}
            action={completeTrip}
            label="Mark as Arrived"
            cls="btn-primary"
          />
        )}

        {booking.stage === 5 && (
          <div className="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm font-medium">Ride completed</span>
          </div>
        )}

        {isCash && !booking.payment_status && booking.stage >= 3 && (
          <StageButton
            bookingId={booking.id}
            action={markPaid}
            label="Mark as Paid (Cash)"
            cls="btn-outline"
          />
        )}
      </div>

    </div>
  )
}
