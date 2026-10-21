import 'server-only'
import { db } from '@/app/lib/db'
import { toIso } from '@/app/lib/api/serialize'

export type ActivityType =
  | 'user_created'
  | 'booking_created'
  | 'booking_completed'
  | 'application_submitted'
  | 'application_reviewed'

// actor is the user the event is about: the new user, the booking's customer
// (created) or driver (completed), or the applicant. The admin who reviewed an
// application isn't stored anywhere, so application_reviewed also points at the applicant.
export async function getRecentActivity(limit: number) {
  // Each branch is limited first so the UNION never sorts whole tables.
  const result = await db.query<{
    type: ActivityType
    at: Date
    actor_id: string | null
    actor_username: string | null
    entity_id: string
  }>(
    `SELECT type, at, actor_id, actor_username, entity_id FROM (
       (SELECT 'user_created' AS type, u.created_at AS at, u.id AS actor_id, u.username AS actor_username, u.id AS entity_id
        FROM users u
        ORDER BY u.created_at DESC LIMIT $1)
       UNION ALL
       (SELECT 'booking_created', b.created_at, c.id, c.username, b.id
        FROM bookings b JOIN users c ON c.id = b.customer_id
        ORDER BY b.created_at DESC LIMIT $1)
       UNION ALL
       (SELECT 'booking_completed', b.delivery_end_time, d.id, d.username, b.id
        FROM bookings b LEFT JOIN users d ON d.id = b.driver_id
        WHERE b.delivery_end_time IS NOT NULL
        ORDER BY b.delivery_end_time DESC LIMIT $1)
       UNION ALL
       (SELECT 'application_submitted', da.created_at, u.id, u.username, da.id
        FROM driver_applications da JOIN users u ON u.id = da.user_id
        ORDER BY da.created_at DESC LIMIT $1)
       UNION ALL
       (SELECT 'application_reviewed', da.reviewed_at, u.id, u.username, da.id
        FROM driver_applications da JOIN users u ON u.id = da.user_id
        WHERE da.reviewed_at IS NOT NULL
        ORDER BY da.reviewed_at DESC LIMIT $1)
     ) feed
     ORDER BY at DESC
     LIMIT $1`,
    [limit]
  )

  return result.rows.map(r => ({
    type: r.type,
    at: toIso(r.at),
    actor: r.actor_id ? { id: r.actor_id, username: r.actor_username } : null,
    entityId: r.entity_id,
  }))
}
