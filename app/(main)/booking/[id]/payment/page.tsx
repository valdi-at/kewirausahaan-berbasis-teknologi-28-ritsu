import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import PaymentMethodSelector from './PaymentMethodSelector'
import PayButton from './PayButton'

export const metadata: Metadata = { title: 'Payment - RITSU' }

type PaymentDetail = {
  id: string
  price: string
  payment_status: boolean
  stage: number
  payment_method_id: string
  payment_method_name: string
  payment_info: Record<string, string>
}

type MethodOption = { id: string; name: string }

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'customer') redirect('/home')

  const { id } = await params

  const [bookingRes, methodsRes] = await Promise.all([
    db.query<PaymentDetail>(
      `SELECT b.id, b.price, b.payment_status, b.stage,
              b.payment_method_id, pm.name AS payment_method_name, pm.payment_info
       FROM bookings b
       JOIN payment_methods pm ON pm.id = b.payment_method_id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [id, user.id]
    ),
    db.query<MethodOption>('SELECT id, name FROM payment_methods ORDER BY name'),
  ])

  const booking = bookingRes.rows[0]
  if (!booking) redirect('/booking')

  const methods = methodsRes.rows
  const isCash  = booking.payment_method_name === 'Cash'

  return (
    <div className="mx-auto max-w-lg px-4 py-8 flex flex-col gap-4">

      {/* Back */}
      <div className="flex items-center gap-2">
        <Link href={`/booking/${id}`} className="btn btn-ghost btn-sm btn-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Payment</h1>
      </div>

      {/* Total */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body py-5 gap-1">
          <p className="text-xs text-base-content/50 uppercase tracking-wide">Total</p>
          <p className="text-3xl font-bold">Rp {Number(booking.price).toLocaleString('id-ID')}</p>
          {booking.payment_status && (
            <span className="badge badge-success badge-sm mt-1">Paid</span>
          )}
        </div>
      </div>

      {booking.payment_status ? (
        /* Already paid */
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body gap-3 py-8 items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-lg">Payment Complete</p>
              <p className="text-sm text-base-content/50 mt-1">Paid via {booking.payment_method_name}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Method selector */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body gap-3 py-5">
              <h2 className="text-sm font-semibold">Payment Method</h2>
              <PaymentMethodSelector
                bookingId={id}
                currentMethodId={booking.payment_method_id}
                methods={methods}
              />
            </div>
          </div>

          {isCash ? (
            <div className="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-sm">Pay your driver directly in cash. Your driver will mark the payment as received.</span>
            </div>
          ) : (
            <PayButton bookingId={id} />
          )}
        </>
      )}
    </div>
  )
}
