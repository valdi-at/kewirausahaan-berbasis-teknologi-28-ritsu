import 'server-only'
import { db } from '@/app/lib/db'
import type { PaymentMethodRow } from '@/app/lib/api/serialize'

export async function listPaymentMethods(): Promise<PaymentMethodRow[]> {
  const result = await db.query<PaymentMethodRow>(
    `SELECT pm.id, pm.name, pm.icon_link, pm.payment_info, pm.created_at,
            COUNT(b.id) AS booking_count
     FROM payment_methods pm
     LEFT JOIN bookings b ON b.payment_method_id = pm.id
     GROUP BY pm.id
     ORDER BY pm.name`
  )
  return result.rows
}
