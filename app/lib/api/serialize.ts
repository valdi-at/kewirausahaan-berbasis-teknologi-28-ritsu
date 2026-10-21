// pg returns COUNT (bigint) and DECIMAL as strings and TIMESTAMPTZ as Date.
// These helpers turn rows into the desktop API conventions (camelCase, numbers, ISO strings).

export function toInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : parseInt(value, 10)
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : parseFloat(value)
}

export function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  return (value instanceof Date ? value : new Date(value)).toISOString()
}

// ── Locations ────────────────────────────────────────────────────────────────

export type Location = {
  lat: number | null
  lng: number | null
  name: string | null
  raw: string
}

function coordinate(value: unknown): number | null {
  const n =
    typeof value === 'number' ? value
    : typeof value === 'string' && value.trim() !== '' ? Number(value)
    : NaN
  return Number.isFinite(n) ? n : null
}

// pickup_location / destination are TEXT holding JSON { lat, lng, name }.
// Same parse-or-fall-back-to-raw approach as locationName() in the booking pages.
export function parseLocation(raw: string): Location {
  try {
    const p = JSON.parse(raw)
    if (p && typeof p === 'object') {
      return {
        lat: coordinate(p.lat),
        lng: coordinate(p.lng),
        name: typeof p.name === 'string' ? p.name : null,
        raw,
      }
    }
  } catch {
    // not JSON, keep raw only
  }
  return { lat: null, lng: null, name: null, raw }
}

// ── Users ────────────────────────────────────────────────────────────────────

export type UserRow = {
  id: string
  username: string
  email: string
  role: string
  created_at: Date
  updated_at: Date
}

export function serializeUser(row: UserRow) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export type BookingRow = {
  id: string
  stage: number
  pickup_location: string
  destination: string
  stops: string[] | null
  distance: string
  price: string
  payment_status: boolean
  payment_method_id: string
  payment_method_name: string
  customer_id: string
  customer_username: string
  driver_id: string | null
  driver_username: string | null
  driver_ready_at: Date | null
  delivery_start_time: Date | null
  delivery_end_time: Date | null
  created_at: Date
  updated_at: Date
}

export function serializeBooking(row: BookingRow) {
  return {
    id: row.id,
    stage: row.stage,
    pickup: parseLocation(row.pickup_location),
    destination: parseLocation(row.destination),
    stops: (row.stops ?? []).map(parseLocation),
    distanceKm: toNumber(row.distance),
    price: toNumber(row.price),
    paymentStatus: row.payment_status,
    paymentMethod: { id: row.payment_method_id, name: row.payment_method_name },
    customer: { id: row.customer_id, username: row.customer_username },
    driver: row.driver_id ? { id: row.driver_id, username: row.driver_username } : null,
    driverReadyAt: toIso(row.driver_ready_at),
    deliveryStartTime: toIso(row.delivery_start_time),
    deliveryEndTime: toIso(row.delivery_end_time),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

// ── Driver applications ──────────────────────────────────────────────────────

export type ApplicationRow = {
  id: string
  user_id: string
  username: string
  email: string
  phone_number: string
  status: string
  admin_message: string | null
  created_at: Date
  reviewed_at: Date | null
}

// The stored file path is never exposed. Admin views get a licenseUrl that
// streams the image through the API; the applicant's own view gets null.
export function serializeApplication(row: ApplicationRow, { withLicenseUrl }: { withLicenseUrl: boolean }) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    email: row.email,
    phoneNumber: row.phone_number,
    status: row.status,
    adminMessage: row.admin_message,
    createdAt: toIso(row.created_at),
    reviewedAt: toIso(row.reviewed_at),
    licenseUrl: withLicenseUrl ? `/api/desktop/v1/admin/applications/${row.id}/license` : null,
  }
}

// ── Payment methods ──────────────────────────────────────────────────────────

export type PaymentMethodRow = {
  id: string
  name: string
  icon_link: string
  payment_info: unknown
  created_at: Date
  booking_count: string
}

export function serializePaymentMethod(row: PaymentMethodRow) {
  return {
    id: row.id,
    name: row.name,
    iconLink: row.icon_link,
    paymentInfo: row.payment_info ?? null,
    createdAt: toIso(row.created_at),
    bookingCount: toInt(row.booking_count),
  }
}
