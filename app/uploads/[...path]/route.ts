import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const filePath = path.resolve(uploadsDir, ...segments)

  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream'
    return new NextResponse(file, {
      headers: { 'Content-Type': contentType },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
