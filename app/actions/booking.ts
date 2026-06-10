'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/app/lib/db'
import { verifySession } from '@/app/lib/dal'
import { isInsideGeofence } from '@/app/lib/geofence'

// ── Driver: claim a stage-1 booking ──────────────────────────────────────────

export async function acceptBooking(formData: FormData) {
  const session = await verifySession()

  const userResult = await db.query<{ role: string }>(
    'SELECT role FROM users WHERE id = $1',
    [session.userId]
  )
  if (userResult.rows[0]?.role !== 'driver') return

  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return

  const etaMinutesRaw = Number(formData.get('etaMinutes'))
  const etaMinutes = Number.isFinite(etaMinutesRaw) && etaMinutesRaw > 0
    ? Math.floor(etaMinutesRaw)
    : 10

  await db.query(
    `UPDATE bookings
     SET driver_id = $1, stage = 2, driver_ready_at = NOW() + ($3 * interval '1 minute'), updated_at = NOW()
     WHERE id = $2 AND stage = 1 AND driver_id IS NULL`,
    [session.userId, bookingId, etaMinutes]
  )

  revalidatePath('/driver/bookings')
}

// ── Customer: create a new booking ───────────────────────────────────────────

type CreateBookingInput = {
  pickupLocation: string
  destination: string
  price: number
  distance: number
  paymentMethodId: string
}

export async function createBooking(
  input: CreateBookingInput
): Promise<{ error: string } | undefined> {
  const session = await verifySession()

  const userResult = await db.query<{ role: string }>(
    'SELECT role FROM users WHERE id = $1',
    [session.userId]
  )
  if (userResult.rows[0]?.role !== 'customer') {
    return { error: 'Only customers can create bookings.' }
  }

  const pickup = JSON.parse(input.pickupLocation)
  const dest   = JSON.parse(input.destination)
  if (!isInsideGeofence(pickup) && !isInsideGeofence(dest)) {
    return { error: 'At least one of the pickup or destination points must be inside the ITS campus area.' }
  }

  const result = await db.query<{ id: string }>(
    `INSERT INTO bookings
       (pickup_location, destination, price, distance, customer_id, payment_method_id, stage)
     VALUES ($1, $2, $3, $4, $5, $6, 1)
     RETURNING id`,
    [
      input.pickupLocation,
      input.destination,
      input.price,
      input.distance,
      session.userId,
      input.paymentMethodId,
    ]
  )

  const bookingId = result.rows[0]?.id
  if (!bookingId) return { error: 'Failed to create booking. Please try again.' }

  redirect(`/booking/${bookingId}`)
}

// ── Customer: confirm driver (stage 2 → 3) ───────────────────────────────────

export async function confirmDriver(formData: FormData) {
  const session = await verifySession()

  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return

  await db.query(
    `UPDATE bookings
     SET stage = 3, delivery_start_time = NOW(), updated_at = NOW()
     WHERE id = $1 AND customer_id = $2 AND stage = 2 AND driver_id IS NOT NULL`,
    [bookingId, session.userId]
  )

  revalidatePath(`/booking/${bookingId}`)
}

// ── Driver: start trip (stage 3 → 4) ─────────────────────────────────────────

export async function startTrip(formData: FormData) {
  const session = await verifySession()
  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return

  await db.query(
    `UPDATE bookings
     SET stage = 4, delivery_start_time = NOW(), updated_at = NOW()
     WHERE id = $1 AND driver_id = $2 AND stage = 3`,
    [bookingId, session.userId]
  )

  revalidatePath(`/driver/booking/${bookingId}`)
  revalidatePath(`/booking/${bookingId}`)
}

// ── Driver: complete trip (stage 4 → 5) ──────────────────────────────────────

export async function completeTrip(formData: FormData) {
  const session = await verifySession()
  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return

  await db.query(
    `UPDATE bookings
     SET stage = 5, delivery_end_time = NOW(), updated_at = NOW()
     WHERE id = $1 AND driver_id = $2 AND stage = 4`,
    [bookingId, session.userId]
  )

  revalidatePath(`/driver/booking/${bookingId}`)
  revalidatePath(`/booking/${bookingId}`)
  revalidatePath('/driver/bookings')
}

// ── Driver: mark cash payment as paid ────────────────────────────────────────

export async function markPaid(formData: FormData) {
  const session = await verifySession()
  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return

  await db.query(
    `UPDATE bookings
     SET payment_status = true, updated_at = NOW()
     WHERE id = $1 AND driver_id = $2 AND payment_status = false`,
    [bookingId, session.userId]
  )

  revalidatePath(`/driver/booking/${bookingId}`)
  revalidatePath(`/booking/${bookingId}`)
}

// ── Customer: change payment method ──────────────────────────────────────────

export async function updatePaymentMethod(formData: FormData) {
  const session = await verifySession()
  const bookingId = formData.get('bookingId') as string
  const paymentMethodId = formData.get('paymentMethodId') as string
  if (!bookingId || !paymentMethodId) return

  await db.query(
    `UPDATE bookings
     SET payment_method_id = $1, updated_at = NOW()
     WHERE id = $2 AND customer_id = $3 AND payment_status = false`,
    [paymentMethodId, bookingId, session.userId]
  )

  revalidatePath(`/booking/${bookingId}/payment`)
}

// ── Customer: pay non-cash booking ───────────────────────────────────────────

export async function payBooking(formData: FormData) {
  const session = await verifySession()
  const bookingId = formData.get('bookingId') as string
  if (!bookingId) return

  await db.query(
    `UPDATE bookings
     SET payment_status = true, updated_at = NOW()
     WHERE id = $1
       AND customer_id = $2
       AND payment_status = false
       AND payment_method_id IN (
         SELECT id FROM payment_methods WHERE name != 'Cash'
       )`,
    [bookingId, session.userId]
  )

  redirect(`/booking/${bookingId}/payment`)
}
