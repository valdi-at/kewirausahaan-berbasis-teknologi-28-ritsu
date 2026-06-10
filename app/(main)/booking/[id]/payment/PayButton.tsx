'use client'
import { useFormStatus } from 'react-dom'
import { payBooking } from '@/app/actions/booking'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
      {pending ? <span className="loading loading-spinner loading-sm" /> : 'Pay Now'}
    </button>
  )
}

export default function PayButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={payBooking}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton />
    </form>
  )
}
