'use client'
import dynamic from 'next/dynamic'

type PaymentMethod = { id: string; name: string }

const BookingMap = dynamic(() => import('./BookingMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-6rem)] md:h-[calc(100dvh-5rem)] items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  ),
})

export default function CreateBookingClient({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  return <BookingMap paymentMethods={paymentMethods} />
}
