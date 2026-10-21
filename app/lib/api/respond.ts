import 'server-only'
import { NextResponse } from 'next/server'
import { ApiError } from '@/app/lib/api/errors'
import { ServiceError } from '@/app/lib/services/errors'

const NO_STORE = { 'Cache-Control': 'no-store' }

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE })
}

export function noContent() {
  return new NextResponse(null, { status: 204, headers: NO_STORE })
}

export function fail(err: unknown) {
  const apiError =
    err instanceof ApiError ? err
    : err instanceof ServiceError ? new ApiError(err.code, err.message, err.details)
    : null

  if (!apiError) {
    console.error('[desktop-api] Unhandled error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } },
      { status: 500, headers: NO_STORE }
    )
  }

  const { code, message, details } = apiError
  return NextResponse.json(
    { error: details === undefined ? { code, message } : { code, message, details } },
    { status: apiError.status, headers: NO_STORE }
  )
}
