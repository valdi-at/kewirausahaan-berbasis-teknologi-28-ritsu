'use client'
import { useFormStatus } from 'react-dom'
import { acceptBooking } from '@/app/actions/booking'

type AvailableBooking = {
  id: string
  pickup_location: string
  destination: string
  price: string
  distance: string
  customer_username: string
  created_at: string
}

function AcceptButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
      {pending
        ? <span className="loading loading-spinner loading-xs" />
        : 'Accept'}
    </button>
  )
}

export default function AvailableBookingCard({ booking }: { booking: AvailableBooking }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" suppressHydrationWarning>
                  <circle cx="12" cy="12" r="6" />
                </svg>
              </span>
              <span className="truncate font-medium">{booking.pickup_location}</span>
            </div>
            <div className="ml-2.5 border-l-2 border-dashed border-base-300 pl-4 text-xs text-base-content/50">
              ↓
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" suppressHydrationWarning>
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="truncate font-medium">{booking.destination}</span>
            </div>
          </div>

          <form action={acceptBooking} className="shrink-0 flex items-center gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <select
              name="etaMinutes"
              defaultValue="10"
              className="select select-bordered select-xs"
              aria-label="Estimated pickup time"
            >
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="30">30 min</option>
            </select>
            <AcceptButton />
          </form>
        </div>

        <div className="flex items-center gap-3 text-xs text-base-content/60 border-t border-base-200 pt-2.5">
          <span className="font-semibold text-base-content">
            Rp {Number(booking.price).toLocaleString('id-ID')}
          </span>
          <span>·</span>
          <span>{Number(booking.distance).toFixed(1)} km</span>
          <span>·</span>
          <span>by {booking.customer_username}</span>
        </div>
      </div>
    </div>
  )
}
