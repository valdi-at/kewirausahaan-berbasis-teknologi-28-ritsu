import 'server-only'
import type { NextRequest } from 'next/server'

// In-memory fixed-window limiter for POST /api/desktop/v1/auth/login.
// It's per process and resets when the server restarts. Good enough for a
// single container; move it to Postgres or Redis if the app is ever scaled out.

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const SWEEP_THRESHOLD = 10_000

const attempts = new Map<string, { count: number; resetAt: number }>()

// Traefik sets X-Forwarded-For. The first entry is the original client.
export function clientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'unknown'
}

// Records one attempt. Returns the seconds to wait if the key is over the limit, otherwise null.
export function hitLoginLimit(key: string): number | null {
  const now = Date.now()

  if (attempts.size > SWEEP_THRESHOLD) {
    for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k)
  }

  let entry = attempts.get(key)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
    attempts.set(key, entry)
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) return Math.ceil((entry.resetAt - now) / 1000)
  return null
}
