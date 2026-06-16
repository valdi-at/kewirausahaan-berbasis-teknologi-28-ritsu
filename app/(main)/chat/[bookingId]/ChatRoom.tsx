'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '@/app/actions/chat'

export type Message = {
  id: string
  sender_id: string
  sender_username: string
  content: string | null
  content_type: string
  media_url: string | null
  created_at: string
}

type MediaPreview = {
  file: File
  localUrl: string
  type: 'image' | 'video' | 'audio'
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
  // ── Core state ──────────────────────────────────────────────────────────────
  const [text, setText]             = useState('')
  const [media, setMedia]           = useState<MediaPreview | null>(null)
  const [isSending, setIsSending]   = useState(false)
  const [showAttach, setShowAttach] = useState(false)

  // ── Voice recording ──────────────────────────────────────────────────────────
  const [voiceRec, setVoiceRec]   = useState(false)
  const [voiceSec, setVoiceSec]   = useState(0)
  const voiceRecRef   = useRef<MediaRecorder | null>(null)
  const voiceChunks   = useRef<Blob[]>([])
  const voiceTimer    = useRef<ReturnType<typeof setInterval> | null>(null)
  const voiceSecRef   = useRef(0)

  // ── Camera ───────────────────────────────────────────────────────────────────
  const [camOpen, setCamOpen]       = useState(false)
  const [camStream, setCamStream]   = useState<MediaStream | null>(null)
  const [camRec, setCamRec]         = useState(false)
  const [camSec, setCamSec]         = useState(0)
  const camVideoRef  = useRef<HTMLVideoElement>(null)
  const camRecRef    = useRef<MediaRecorder | null>(null)
  const camChunks    = useRef<Blob[]>([])
  const camTimer     = useRef<ReturnType<typeof setInterval> | null>(null)
  const camSecRef    = useRef(0)

  // ── Misc refs ────────────────────────────────────────────────────────────────
  const bottomRef    = useRef<HTMLDivElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const router       = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages])

  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [router, isActive])

  // Close attach menu when clicking outside
  useEffect(() => {
    if (!showAttach) return
    const close = () => setShowAttach(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showAttach])

  // Wire camera stream to video element after it mounts
  useEffect(() => {
    const el = camVideoRef.current
    if (!el || !camStream) return
    el.srcObject = camStream
    el.play().catch(() => {})
  }, [camStream, camOpen])

  // Stop camera stream tracks when stream changes or component unmounts
  useEffect(() => {
    return () => { camStream?.getTracks().forEach(t => t.stop()) }
  }, [camStream])

  // ── Media helpers ─────────────────────────────────────────────────────────────
  function pickFile(file: File) {
    if (media?.localUrl) URL.revokeObjectURL(media.localUrl)
    const type = file.type.startsWith('image/') ? 'image' as const
               : file.type.startsWith('video/') ? 'video' as const
               : 'audio' as const
    setMedia({ file, localUrl: URL.createObjectURL(file), type })
  }

  function clearMedia() {
    if (media?.localUrl) URL.revokeObjectURL(media.localUrl)
    setMedia(null)
  }

  // ── Voice recording ────────────────────────────────────────────────────────────
  async function startVoice() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      voiceChunks.current   = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) voiceChunks.current.push(e.data) }
      recorder.start()
      voiceRecRef.current = recorder
      voiceSecRef.current = 0
      setVoiceRec(true)
      setVoiceSec(0)
      voiceTimer.current = setInterval(() => { voiceSecRef.current++; setVoiceSec(voiceSecRef.current) }, 1000)
    } catch {
      setVoiceRec(false)
    }
  }

  function stopVoice(save: boolean) {
    if (voiceTimer.current) { clearInterval(voiceTimer.current); voiceTimer.current = null }
    const rec = voiceRecRef.current
    if (!rec || rec.state === 'inactive') { setVoiceRec(false); return }
    const seconds = voiceSecRef.current
    rec.onstop = () => {
      rec.stream.getTracks().forEach(t => t.stop())
      if (save && seconds >= 1) {
        const blob = new Blob(voiceChunks.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.weba`, { type: 'audio/webm' })
        if (media?.localUrl) URL.revokeObjectURL(media.localUrl)
        setMedia({ file, localUrl: URL.createObjectURL(blob), type: 'audio' })
      }
    }
    rec.stop()
    voiceRecRef.current = null
    voiceSecRef.current = 0
    setVoiceRec(false)
    setVoiceSec(0)
  }

  // ── Camera ─────────────────────────────────────────────────────────────────────
  async function openCamera() {
    setShowAttach(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
      setCamStream(stream)
      setCamOpen(true)
    } catch {
      // permission denied or no camera
    }
  }

  function closeCamera() {
    if (camRecRef.current && camRecRef.current.state !== 'inactive') camRecRef.current.stop()
    if (camTimer.current) { clearInterval(camTimer.current); camTimer.current = null }
    camRecRef.current = null
    camSecRef.current = 0
    // setCamStream(null) triggers the useEffect cleanup that stops tracks
    setCamStream(null)
    setCamRec(false)
    setCamSec(0)
    setCamOpen(false)
  }

  function takePhoto() {
    const video = camVideoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      pickFile(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  function startCamRec() {
    if (!camStream) return
    const recorder = new MediaRecorder(camStream)
    camChunks.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) camChunks.current.push(e.data) }
    recorder.start()
    camRecRef.current = recorder
    camSecRef.current = 0
    setCamRec(true)
    setCamSec(0)
    camTimer.current = setInterval(() => { camSecRef.current++; setCamSec(camSecRef.current) }, 1000)
  }

  function stopCamRec() {
    if (camTimer.current) { clearInterval(camTimer.current); camTimer.current = null }
    const rec = camRecRef.current
    if (!rec || rec.state === 'inactive') return
    rec.onstop = () => {
      const blob = new Blob(camChunks.current, { type: 'video/webm' })
      pickFile(new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' }))
      closeCamera()
    }
    rec.stop()
    camRecRef.current = null
    setCamRec(false)
  }

  // ── Send ──────────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (isSending || (!text.trim() && !media)) return
    setIsSending(true)
    try {
      const fd = new FormData()
      fd.append('bookingId', bookingId)

      if (media) {
        const up = new FormData()
        up.append('file', media.file)
        const res = await fetch('/api/chat/upload', { method: 'POST', body: up })
        if (!res.ok) throw new Error('Upload failed')
        const { url } = await res.json() as { url: string }
        fd.append('content_type', media.type)
        fd.append('media_url', url)
        if (text.trim()) fd.append('content', text.trim())
        URL.revokeObjectURL(media.localUrl)
        setMedia(null)
        setText('')
      } else {
        const content = text.trim()
        if (!content) return
        fd.append('content_type', 'text')
        fd.append('content', content)
        setText('')
      }

      await sendMessage(fd)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  const hasContent = text.trim().length > 0 || media !== null
  const showMic    = !hasContent

  function fmt(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/*
        Gallery input — always in the DOM so onChange fires even after the menu closes.
        Triggered via ref.click() from a real onClick handler (required for browser security).
      */}
      <input
        ref={galleryInput}
        type="file"
        accept="image/*,video/*"
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) pickFile(file)
          e.target.value = ''
        }}
      />

      {/* ── Camera modal ───────────────────────────────────────────────────────── */}
      {camOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <button
              className="h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center"
              onClick={closeCamera}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {camRec && (
              <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-mono">{fmt(camSec)}</span>
              </div>
            )}

            <div className="w-9" />
          </div>

          {/* Live video */}
          <video
            ref={camVideoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 w-full object-cover"
          />

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 flex items-center justify-center gap-12 bg-gradient-to-t from-black/60 to-transparent">
            {!camRec ? (
              <>
                {/* Take photo */}
                <button className="flex flex-col items-center gap-2" onClick={takePhoto}>
                  <span className="h-16 w-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </span>
                  <span className="text-white text-xs font-medium">Photo</span>
                </button>

                {/* Record video */}
                <button className="flex flex-col items-center gap-2" onClick={startCamRec}>
                  <span className="h-16 w-16 rounded-full border-4 border-red-500 bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="h-5 w-5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-white text-xs font-medium">Video</span>
                </button>
              </>
            ) : (
              /* Stop recording */
              <button className="flex flex-col items-center gap-2" onClick={stopCamRec}>
                <span className="h-16 w-16 rounded-full border-4 border-red-500 bg-red-500/30 backdrop-blur-sm flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" suppressHydrationWarning>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                </span>
                <span className="text-white text-xs font-medium">Stop</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-base-content/40 mt-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          const time   = new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="text-xs text-base-content/50 px-1">{msg.sender_username}</span>
                )}
                <div className={`rounded-2xl overflow-hidden text-sm leading-snug ${
                  isMine
                    ? 'bg-primary text-primary-content rounded-br-sm'
                    : 'bg-base-200 text-base-content rounded-bl-sm'
                }`}>
                  {msg.content_type === 'image' && msg.media_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.media_url} alt="" className="max-w-[260px] max-h-[340px] object-cover block" />
                  )}
                  {msg.content_type === 'video' && msg.media_url && (
                    <video src={msg.media_url} controls className="max-w-[260px] max-h-[340px] block" />
                  )}
                  {msg.content_type === 'audio' && msg.media_url && (
                    <div className="px-3 py-2.5">
                      <audio src={msg.media_url} controls className="h-8 w-52 max-w-full" />
                    </div>
                  )}
                  {msg.content && (
                    <p className={`px-3.5 py-2.5 ${msg.content_type !== 'text' ? 'pt-1 pb-2.5' : ''}`}>
                      {msg.content}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-base-content/30 px-1">{time}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────────── */}
      <div className="border-t border-base-200 px-4 py-3 relative">
        {!isActive ? (
          <p className="text-center text-xs text-base-content/40 py-2">
            This booking has ended. Chat is read-only.
          </p>

        ) : voiceRec ? (
          /* Voice recording bar */
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
            </span>
            <span className="text-sm font-mono text-error flex-1">Recording {fmt(voiceSec)}</span>
            <button
              className="btn btn-ghost btn-sm btn-circle text-base-content/40"
              onPointerDown={(e) => { e.stopPropagation(); stopVoice(false) }}
              title="Cancel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button
              className="btn btn-error btn-sm btn-circle"
              onPointerDown={(e) => { e.stopPropagation(); stopVoice(true) }}
              title="Done"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" suppressHydrationWarning>
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
          </div>

        ) : (
          <>
            {/* Attach menu */}
            {showAttach && (
              <div
                className="absolute bottom-full left-4 mb-2 bg-base-100 border border-base-200 shadow-lg rounded-2xl overflow-hidden z-20 min-w-[160px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Gallery */}
                <button
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-base-200 w-full text-left transition-colors"
                  onClick={() => {
                    setShowAttach(false)
                    galleryInput.current?.click()
                  }}
                >
                  <span className="text-base-content/60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">Gallery</span>
                </button>

                <div className="h-px bg-base-200" />

                {/* Camera — uses getUserMedia so it works on desktop too */}
                <button
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-base-200 w-full text-left transition-colors"
                  onClick={openCamera}
                >
                  <span className="text-base-content/60">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">Camera</span>
                </button>
              </div>
            )}

            {/* Media preview */}
            {media && (
              <div className="mb-2.5 relative w-fit">
                {media.type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.localUrl} alt="" className="max-h-40 max-w-[180px] rounded-xl object-cover" />
                )}
                {media.type === 'video' && (
                  <video src={media.localUrl} className="max-h-40 max-w-[180px] rounded-xl" />
                )}
                {media.type === 'audio' && (
                  <div className="bg-base-200 rounded-xl px-3 py-2.5">
                    <audio src={media.localUrl} controls className="h-8 w-52" />
                  </div>
                )}
                <button
                  className="btn btn-circle btn-xs absolute -top-1.5 -right-1.5 bg-base-content text-base-100 border-0"
                  onClick={clearMedia}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-end gap-2">
              <button
                className={`btn btn-ghost btn-sm btn-circle shrink-0 ${showAttach ? 'bg-base-200' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowAttach(v => !v) }}
                title="Attach"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                placeholder="Type a message…"
                className="textarea textarea-bordered flex-1 resize-none text-sm leading-snug min-h-[2.5rem] max-h-28"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
              />

              {showMic ? (
                <button
                  className="btn btn-ghost btn-sm btn-circle shrink-0"
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startVoice() }}
                  onPointerUp={() => stopVoice(true)}
                  onPointerCancel={() => stopVoice(false)}
                  title="Hold to record audio"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm btn-circle shrink-0"
                  onClick={handleSend}
                  disabled={!hasContent || isSending}
                >
                  {isSending
                    ? <span className="loading loading-spinner loading-xs" />
                    : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )
                  }
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
