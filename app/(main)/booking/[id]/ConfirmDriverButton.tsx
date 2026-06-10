'use client'
import { useFormStatus } from 'react-dom'
import { confirmDriver } from '@/app/actions/booking'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
      {pending
        ? <span className="loading loading-spinner loading-sm" />
        : 'Confirm Driver'}
    </button>
  )
}

export default function ConfirmDriverButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={confirmDriver} className="flex gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton />
    </form>
  )
}
