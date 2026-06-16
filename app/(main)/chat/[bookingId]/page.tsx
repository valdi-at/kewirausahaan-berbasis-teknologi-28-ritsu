import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import ChatRoom from './ChatRoom'

export const metadata: Metadata = { title: 'Chat - RITSU' }

type BookingAccess = {
  stage: number
  other_username: string
}

type Message = {
  id: string
  sender_id: string
  sender_username: string
  content: string
  created_at: string
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { bookingId } = await params

  const accessResult = await db.query<BookingAccess>(
    `SELECT b.stage, other_u.username AS other_username
     FROM bookings b
     JOIN users other_u ON other_u.id = CASE
       WHEN b.customer_id = $2 THEN b.driver_id
       ELSE b.customer_id
     END
     WHERE b.id = $1
       AND (b.customer_id = $2 OR b.driver_id = $2)
       AND b.driver_id IS NOT NULL`,
    [bookingId, user.id]
  )

  const booking = accessResult.rows[0]
  if (!booking) notFound()

  const msgResult = await db.query<Message>(
    `SELECT m.id, m.sender_id, u.username AS sender_username, m.content, m.created_at
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.booking_id = $1
     ORDER BY m.created_at ASC`,
    [bookingId]
  )

  const messages  = msgResult.rows
  const isActive  = booking.stage < 5

  return (
    <div className="mx-auto max-w-lg flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base-200">
        <Link href="/chat" className="btn btn-ghost btn-sm btn-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{booking.other_username}</p>
          <p className="text-xs text-base-content/40">
            Booking ·{' '}
            <span className={`font-medium ${isActive ? 'text-success' : 'text-base-content/40'}`}>
              {isActive ? 'Active' : 'Ended'}
            </span>
          </p>
        </div>
        <Link href={`/booking/${bookingId}`} className="btn btn-ghost btn-xs text-base-content/50">
          View booking
        </Link>
      </div>

      <ChatRoom
        bookingId={bookingId}
        currentUserId={user.id}
        messages={messages}
        isActive={isActive}
      />
    </div>
  )
}
