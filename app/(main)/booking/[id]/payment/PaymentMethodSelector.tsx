'use client'
import { useRef } from 'react'
import { updatePaymentMethod } from '@/app/actions/booking'

type Method = { id: string; name: string }

export default function PaymentMethodSelector({
  bookingId,
  currentMethodId,
  methods,
}: {
  bookingId: string
  currentMethodId: string
  methods: Method[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form ref={formRef} action={updatePaymentMethod}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        key={currentMethodId}
        name="paymentMethodId"
        defaultValue={currentMethodId}
        className="select select-bordered w-full"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {methods.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </form>
  )
}
