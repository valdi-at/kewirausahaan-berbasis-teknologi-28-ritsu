'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/app/lib/db'
import { verifySession } from '@/app/lib/dal'

export async function sendMessage(formData: FormData) {
  const session     = await verifySession()
  const bookingId   = formData.get('bookingId') as string
  const contentType = (formData.get('content_type') as string | null) ?? 'text'
  const content     = (formData.get('content') as string | null)?.trim() || null
  const mediaUrl    = (formData.get('media_url') as string | null) || null

  if (!bookingId) return
  if (contentType === 'text' && !content) return
  if (contentType !== 'text' && !mediaUrl) return

  const access = await db.query<{ id: string }>(
    `SELECT id FROM bookings WHERE id = $1 AND (customer_id = $2 OR driver_id = $2)`,
    [bookingId, session.userId]
  )
  if (!access.rows[0]) return

  await db.query(
    `INSERT INTO chat_messages (booking_id, sender_id, content, content_type, media_url)
     VALUES ($1, $2, $3, $4, $5)`,
    [bookingId, session.userId, content, contentType, mediaUrl]
  )

  revalidatePath(`/chat/${bookingId}`)
}
