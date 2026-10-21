import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import { getOptionalUser } from '@/app/lib/dal'
import { db } from '@/app/lib/db'
import { contentTypeFor, resolveUploadPath, uploadUrlPath } from '@/app/lib/uploads'

// License images are only for admins and the applicant who uploaded them.
async function licenseAccessStatus(urlPath: string): Promise<401 | 403 | null> {
  const user = await getOptionalUser()
  if (!user) return 401
  if (user.role === 'admin') return null

  const owned = await db.query(
    'SELECT 1 FROM driver_applications WHERE user_id = $1 AND driving_license_image = $2 LIMIT 1',
    [user.id, urlPath]
  )
  return (owned.rowCount ?? 0) > 0 ? null : 403
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = resolveUploadPath(segments)

  if (!filePath) {
    return new NextResponse(null, { status: 403 })
  }

  // Check the resolved path, so chat/../licenses/x can't skip the guard.
  const urlPath = uploadUrlPath(filePath)
  const isLicense = urlPath.split('/')[2] === 'licenses'
  if (isLicense) {
    const status = await licenseAccessStatus(urlPath)
    if (status) return new NextResponse(null, { status })
  }

  try {
    const file = await fs.readFile(filePath)
    return new NextResponse(file, {
      headers: isLicense
        ? { 'Content-Type': contentTypeFor(filePath), 'Cache-Control': 'private, no-store' }
        : { 'Content-Type': contentTypeFor(filePath) },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
