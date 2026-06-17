import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'

export const metadata: Metadata = { title: 'Chats - RITSU' }

type ChatRow = {
  booking_id: string
  stage: number
  created_at: string
  other_username: string
  last_message: string | null
  last_message_at: string | null
}

export default async function ChatListPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const result = await db.query<ChatRow>(
    `SELECT
       b.id            AS booking_id,
       b.stage,
       b.created_at,
       other_u.username AS other_username,
       last_m.content   AS last_message,
       last_m.created_at AS last_message_at
     FROM bookings b
     JOIN users other_u ON other_u.id = CASE
       WHEN b.customer_id = $1 THEN b.driver_id
       ELSE b.customer_id
     END
     LEFT JOIN LATERAL (
       SELECT content, created_at
       FROM chat_messages
       WHERE booking_id = b.id
       ORDER BY created_at DESC
       LIMIT 1
     ) last_m ON true
     WHERE (b.customer_id = $1 OR b.driver_id = $1)
       AND b.driver_id IS NOT NULL
     ORDER BY COALESCE(last_m.created_at, b.created_at) DESC`,
    [user.id]
  )

  const chats = result.rows

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-lg font-bold mb-4">Chats</h1>

      {chats.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p className="text-sm">No chats yet.</p>
          <p className="text-xs mt-1">Chats appear once a driver is assigned to a booking.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 stagger">
          {chats.map((chat) => {
            const isActive = chat.stage < 5
            const date = new Date(chat.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })

            return (
              <li key={chat.booking_id}>
                <Link
                  href={`/chat/${chat.booking_id}`}
                  className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow block"
                >
                  <div className="card-body py-4 px-5 flex flex-row items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content/60">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{chat.other_username}</span>
                        <span className={`badge badge-xs shrink-0 ${isActive ? 'badge-success' : 'badge-ghost'}`}>
                          {isActive ? 'Active' : 'Ended'}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/50 mt-0.5">Booking · {date}</p>
                      {chat.last_message && (
                        <p className="text-xs text-base-content/40 mt-1 truncate">{chat.last_message}</p>
                      )}
                    </div>

                    <svg className="shrink-0 text-base-content/20" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
