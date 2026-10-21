import { connection } from 'next/server'
import { db } from '@/app/lib/db'
import { ok, fail } from '@/app/lib/api/respond'

// No auth. RITSU Desk calls this on startup to check it's talking to a compatible server.
export async function GET() {
  try {
    // Nothing here reads the request, so make sure Next never prerenders it at build time.
    await connection()

    const [migration, timezone] = await Promise.all([
      db.query<{ name: string | null }>('SELECT MAX(name) AS name FROM _migrations').catch((e) => {
        // 42P01 = undefined_table, the migrator has never run against this database
        if ((e as { code?: string }).code === '42P01') return null
        throw e
      }),
      db.query<{ TimeZone: string }>('SHOW timezone'),
    ])

    return ok({
      apiVersion: 1,
      schemaVersion: migration?.rows[0]?.name ?? null,
      serverTime: new Date().toISOString(),
      dbTimezone: timezone.rows[0]?.TimeZone ?? null,
    })
  } catch (e) {
    return fail(e)
  }
}
