import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession()
  const { id } = await params

  const result = await db.query<{ latitude: string; longitude: string; updated_at: string }>(
    `SELECT bc.latitude, bc.longitude, bc.updated_at
     FROM bookings b
     JOIN beacons bc ON bc.driver_id = b.driver_id
     WHERE b.id = $1 AND b.customer_id = $2 AND b.stage IN (3, 4)
       AND bc.is_active = true AND bc.latitude IS NOT NULL AND bc.longitude IS NOT NULL`,
    [id, session.userId]
  )

  const row = result.rows[0]
  if (!row) return NextResponse.json({ location: null })

  return NextResponse.json({
    location: {
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      updatedAt: row.updated_at,
    },
  })
}
