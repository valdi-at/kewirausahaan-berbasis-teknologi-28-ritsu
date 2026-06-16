import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'
import { verifySession } from '@/app/lib/dal'

const ALLOWED: Record<string, string> = {
  'image/jpeg':       '.jpg',
  'image/png':        '.png',
  'image/webp':       '.webp',
  'image/gif':        '.gif',
  'image/heic':       '.heic',
  'video/mp4':        '.mp4',
  'video/webm':       '.webm',
  'video/quicktime':  '.mov',
  'audio/mpeg':       '.mp3',
  'audio/mp4':        '.m4a',
  'audio/ogg':        '.oga',
  'audio/wav':        '.wav',
  'audio/webm':       '.weba',
}

const MAX_BYTES = 100 * 1024 * 1024 // 100 MB

export async function POST(req: NextRequest) {
  try {
    await verifySession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Strip codec params: "audio/webm;codecs=opus" → "audio/webm"
  const mimeBase = file.type.split(';')[0].trim()
  const ext = ALLOWED[mimeBase]
  if (!ext) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 100 MB)' }, { status: 400 })

  const filename   = `${randomUUID()}${ext}`
  const uploadDir  = path.join(process.cwd(), 'public', 'uploads', 'chat')
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/uploads/chat/${filename}` })
}
