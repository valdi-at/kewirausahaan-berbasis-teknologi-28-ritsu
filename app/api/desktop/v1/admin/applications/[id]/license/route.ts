import { NextRequest } from 'next/server'
import { createReadStream } from 'fs'
import fs from 'fs/promises'
import { Readable } from 'stream'
import { requireApiUser } from '@/app/lib/api/auth'
import { ApiError } from '@/app/lib/api/errors'
import { fail } from '@/app/lib/api/respond'
import { parseId } from '@/app/lib/api/validation'
import { getApplicationLicensePath } from '@/app/lib/queries/applications'
import { contentTypeFor, resolveStoredUpload } from '@/app/lib/uploads'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiUser(req, { roles: ['admin'] })
    const id = parseId((await params).id)

    const storedPath = await getApplicationLicensePath(id)
    // Same traversal guard as app/uploads/[...path]/route.ts
    const filePath = storedPath ? resolveStoredUpload(storedPath) : null
    if (!filePath) throw new ApiError('NOT_FOUND', 'License image not found.')

    const stat = await fs.stat(filePath).catch(() => null)
    if (!stat?.isFile()) throw new ApiError('NOT_FOUND', 'License image not found.')

    const body = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>
    return new Response(body, {
      headers: {
        'Content-Type': contentTypeFor(filePath),
        'Content-Length': String(stat.size),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return fail(e)
  }
}
