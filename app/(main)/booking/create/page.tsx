import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import CreateBookingClient from './CreateBookingClient'

export const metadata: Metadata = { title: 'Book a Ride - RITSU' }

type PaymentMethod = { id: string; name: string }

export default async function CreateBookingPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')
  if (user.role !== 'customer') redirect('/booking')

  const result = await db.query<PaymentMethod>(
    'SELECT id, name FROM payment_methods ORDER BY name'
  )

  return <CreateBookingClient paymentMethods={result.rows} />
}
