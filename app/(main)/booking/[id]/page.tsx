import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import ConfirmDriverButton from './ConfirmDriverButton'
import AutoRefresh from './AutoRefresh'

export const metadata: Metadata = { title: 'Booking - RITSU' }

type Booking = {
  id: string
  pickup_location: string
  destination: string
  stage: number
  price: string
  distance: string
  payment_status: boolean
  driver_ready_at: string | null
  driver_username: string | null
  created_at: string
}

const STAGE_INFO: Record<number, { label: string; cls: string; desc: string }> = {
  1: { label: 'Finding driver',    cls: 'badge-warning', desc: 'Waiting for a driver to respond to your ride request.'       },
  2: { label: 'Driver responding', cls: 'badge-info',    desc: 'A driver has set their arrival time. Confirm them below.'    },
  3: { label: 'On the way',        cls: 'badge-primary', desc: 'Your driver is confirmed and heading to your pickup point.'   },
  4: { label: 'In transit',        cls: 'badge-primary', desc: 'You\'re on the way to your destination.'                     },
  5: { label: 'Completed',         cls: 'badge-success', desc: 'Your ride has been completed.'                               },
}

function locationName(raw: string): string {
  try {
    const p = JSON.parse(raw)
    return p.name ?? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}`
  } catch {
    return raw
  }
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'customer') redirect('/home')

  const { id } = await params

  const result = await db.query<Booking>(
    `SELECT
       b.id, b.pickup_location, b.destination, b.stage,
       b.price, b.distance, b.payment_status, b.driver_ready_at, b.created_at,
       d.username AS driver_username
     FROM bookings b
     LEFT JOIN users d ON d.id = b.driver_id
     WHERE b.id = $1 AND b.customer_id = $2`,
    [id, user.id]
  )

  const booking = result.rows[0]
  if (!booking) notFound()

  const from    = locationName(booking.pickup_location)
  const to      = locationName(booking.destination)
  const stage   = STAGE_INFO[booking.stage] ?? { label: `Stage ${booking.stage}`, cls: 'badge-ghost', desc: '' }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-4">

      {booking.stage < 5 && <AutoRefresh />}

      {/* Back */}
      <div className="flex items-center gap-2">
        <Link href="/booking" className="btn btn-ghost btn-sm btn-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Booking</h1>
      </div>

      {/* Stage banner */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-3 py-5">
          <div className="flex items-center gap-3">
            {booking.stage === 1 && <span className="loading loading-ring loading-sm text-warning" />}
            {booking.stage === 2 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-info/15 text-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            )}
            {(booking.stage === 3 || booking.stage === 4 || booking.stage === 5) && (
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${booking.stage === 5 ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <polyline points="22 4 12 14.01 9 11.01" /><path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                </svg>
              </span>
            )}
            <div>
              <span className={`badge badge-sm ${stage.cls}`}>{stage.label}</span>
              <p className="text-xs text-base-content/50 mt-1">{stage.desc}</p>
            </div>
          </div>

          {/* Stage 2: driver info + ready time */}
          {booking.stage === 2 && booking.driver_username && (
            <div className="bg-info/10 rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold">{booking.driver_username}</p>
              {booking.driver_ready_at && (
                <p className="text-xs text-base-content/60 mt-0.5">
                  Estimated pickup: {new Date(booking.driver_ready_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}

          {/* Stage 3+: driver confirmed */}
          {booking.stage >= 3 && booking.driver_username && (
            <div className={`rounded-xl px-4 py-3 text-sm ${booking.stage === 5 ? 'bg-success/10' : 'bg-primary/10'}`}>
              <p className="font-semibold">{booking.driver_username}</p>
              <p className="text-xs text-base-content/60 mt-0.5">{booking.stage === 5 ? 'Completed by' : 'Your driver'}</p>
              {booking.stage === 3 && booking.driver_ready_at && (
                <p className="text-xs text-base-content/60 mt-0.5">
                  Estimated pickup: {new Date(booking.driver_ready_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-3 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-base-content/40">Route</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0891b2] shrink-0" />
              <span>{from}</span>
            </div>
            <span className="ml-[3px] w-px h-3 bg-base-300 block" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-[#ca8a04] shrink-0" />
              <span>{to}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body gap-0 py-0 px-0">
          {[
            ['Distance',  `${Number(booking.distance).toFixed(1)} km`],
            ['Price',     `Rp ${Number(booking.price).toLocaleString('id-ID')}`],
            ['Payment',   booking.payment_status ? 'Paid' : 'Unpaid'],
            ['Booked at', new Date(booking.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })],
          ].map(([label, value], i, arr) => (
            <div key={label}>
              <div className="flex justify-between items-center px-5 py-3.5 text-sm">
                <span className="text-base-content/50">{label}</span>
                <span className={`font-medium ${label === 'Payment' && !booking.payment_status ? 'text-warning' : ''}`}>{value}</span>
              </div>
              {i < arr.length - 1 && <div className="divider my-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {booking.stage === 2 && <ConfirmDriverButton bookingId={booking.id} />}

        {!booking.payment_status && (
          <Link href={`/booking/${booking.id}/payment`} className="btn btn-outline btn-block">
            Pay Now
          </Link>
        )}
      </div>

    </div>
  )
}
