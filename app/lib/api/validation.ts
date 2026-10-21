import 'server-only'
import * as z from 'zod'
import type { NextRequest } from 'next/server'
import { ApiError } from '@/app/lib/api/errors'

const IdSchema = z.uuid()

// A malformed path ID is a 404, never a Postgres 22P02. Lowercased because
// Postgres accepts upper-case UUIDs and IDs get compared as strings.
export function parseId(id: string): string {
  const result = IdSchema.safeParse(id)
  if (!result.success) throw new ApiError('NOT_FOUND', 'Not found.')
  return result.data.toLowerCase()
}

function validate<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new ApiError(
      'VALIDATION_ERROR',
      result.error.issues[0]?.message ?? 'Invalid request.',
      z.flattenError(result.error)
    )
  }
  return result.data
}

// Empty query values (?q=&stage=) are treated as not set.
export function parseQuery<S extends z.ZodType>(schema: S, req: NextRequest): z.output<S> {
  const raw = Object.fromEntries(
    [...req.nextUrl.searchParams.entries()].filter(([, value]) => value !== '')
  )
  return validate(schema, raw)
}

export async function parseBody<S extends z.ZodType>(schema: S, req: NextRequest): Promise<z.output<S>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new ApiError('VALIDATION_ERROR', 'Request body must be valid JSON.')
  }
  return validate(schema, body)
}
