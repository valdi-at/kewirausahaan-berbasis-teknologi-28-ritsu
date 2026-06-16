'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '@/app/actions/chat'

type Message = {
  id: string
  sender_id: string
  sender_username: string
  content: string
  created_at: string
}

export default function ChatRoom({
  bookingId,
  currentUserId,
  messages,
  isActive,
}: {
  bookingId: string
  currentUserId: string
  messages: Message[]
  isActive: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const formRef   = useRef<HTMLFormElement>(null)
  const router    = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages every 3s while chat is active
  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [router, isActive])

  async function handleSend(formData: FormData) {
    formRef.current?.reset()
    await sendMessage(formData)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-7rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-base-content/40 mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          const time   = new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMine && (
                  <span className="text-xs text-base-content/50 px-1">{msg.sender_username}</span>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                  isMine
                    ? 'bg-primary text-primary-content rounded-br-sm'
                    : 'bg-base-200 text-base-content rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-base-content/30 px-1">{time}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-base-200 px-4 py-3">
        {isActive ? (
          <form ref={formRef} action={handleSend} className="flex gap-2 items-end">
            <input type="hidden" name="bookingId" value={bookingId} />
            <textarea
              name="content"
              rows={1}
              placeholder="Type a message…"
              className="textarea textarea-bordered flex-1 resize-none text-sm leading-snug min-h-[2.5rem] max-h-28"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm h-10 px-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        ) : (
          <p className="text-center text-xs text-base-content/40 py-2">
            This booking has ended. Chat is read-only.
          </p>
        )}
      </div>
    </div>
  )
}
