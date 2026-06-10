import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/db'

export async function POST(req: NextRequest) {
  const session = await verifySession()

  const userResult = await db.query<{ role: string }>(
    'SELECT role FROM users WHERE id = $1',
    [session.userId]
  )
  if (userResult.rows[0]?.role !== 'driver') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const lat = Number(body?.lat)
  const lng = Number(body?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  await db.query(
    `INSERT INTO beacons (driver_id, is_active, latitude, longitude, updated_at)
     VALUES ($1, true, $2, $3, NOW())
     ON CONFLICT (driver_id) DO UPDATE
       SET is_active = true, latitude = $2, longitude = $3, updated_at = NOW()`,
    [session.userId, lat, lng]
  )

  return NextResponse.json({ ok: true })
}
