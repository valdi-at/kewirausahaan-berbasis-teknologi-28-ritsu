import * as z from 'zod'
import { PaginationSchema } from '@/app/lib/api/pagination'

// Query string and body schemas for /api/desktop/v1. Business rules (valid
// roles, non-empty reject reason) live in app/lib/services, not here.

const IsoTimestamp = z.union([z.iso.datetime({ offset: true, local: true }), z.iso.date()], {
  error: 'Must be an ISO 8601 date or date-time.',
})

const Search = z.string().trim().max(100, { error: 'q must be at most 100 characters.' })

const Stage = z.coerce
  .number({ error: 'stage must be a number.' })
  .int({ error: 'stage must be an integer.' })
  .min(1, { error: 'stage must be between 1 and 5.' })
  .max(5, { error: 'stage must be between 1 and 5.' })

const Paid = z
  .enum(['true', 'false'], { error: "paid must be 'true' or 'false'." })
  .transform((v) => v === 'true')

export const BookingSideSchema = z.enum(['customer', 'driver'], {
  error: "as must be 'customer' or 'driver'.",
})

const BookingFilters = {
  stage: Stage.optional(),
  paid: Paid.optional(),
  from: IsoTimestamp.optional(),
  to: IsoTimestamp.optional(),
  q: Search.optional(),
}

export const MeSummaryQuerySchema = z.object({
  as: BookingSideSchema.optional(),
})

export const MeBookingsQuerySchema = PaginationSchema.extend({
  as: BookingSideSchema.optional(),
  ...BookingFilters,
})

export const AdminBookingsQuerySchema = PaginationSchema.extend({
  ...BookingFilters,
  paymentMethodId: z.uuid({ error: 'paymentMethodId must be a UUID.' }).optional(),
})

export const AdminUsersQuerySchema = PaginationSchema.extend({
  q: Search.optional(),
  role: z.enum(['customer', 'driver', 'admin'], { error: "role must be 'customer', 'driver' or 'admin'." }).optional(),
})

export const AdminApplicationsQuerySchema = PaginationSchema.extend({
  status: z.enum(['pending', 'approved', 'declined'], {
    error: "status must be 'pending', 'approved' or 'declined'.",
  }).optional(),
})

export const ActivityQuerySchema = z.object({
  limit: z.coerce
    .number({ error: 'limit must be a number.' })
    .int({ error: 'limit must be an integer.' })
    .min(1, { error: 'limit must be between 1 and 50.' })
    .max(50, { error: 'limit must be between 1 and 50.' })
    .default(20),
})

export const ChangeRoleBodySchema = z.object({
  role: z.string({ error: 'role is required.' }),
})

export const RejectBodySchema = z.object({
  reason: z.string({ error: 'reason is required.' }),
})
