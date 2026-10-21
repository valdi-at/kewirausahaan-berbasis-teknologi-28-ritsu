import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/app/lib/db'
import { LoginFormSchema } from '@/app/lib/definitions'
import { issueDesktopToken } from '@/app/lib/api/auth'
import { ApiError } from '@/app/lib/api/errors'
import { clientIp, hitLoginLimit } from '@/app/lib/api/rate-limit'
import { ok, fail } from '@/app/lib/api/respond'
import { serializeUser, type UserRow } from '@/app/lib/api/serialize'
import { parseBody } from '@/app/lib/api/validation'

// bcrypt hash (cost 12, same as signup) of a random string nobody knows. Compared
// against when the email doesn't exist, so the response takes the same time either way.
const DUMMY_HASH = '$2b$12$IRwqhi5BV8l8zclnR7s7EuxetRmJUvIjE0XXNMWQ0dKlqpInRvo5O'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await parseBody(LoginFormSchema, req)

    const retryAfterSeconds = hitLoginLimit(`${clientIp(req)}|${email.toLowerCase()}`)
    if (retryAfterSeconds !== null) {
      throw new ApiError('RATE_LIMITED', 'Too many login attempts. Please try again later.', { retryAfterSeconds })
    }

    const result = await db.query<UserRow & { password_hash: string }>(
      'SELECT id, username, email, role, created_at, updated_at, password_hash FROM users WHERE email = $1',
      [email]
    )
    const user = result.rows[0]

    const passwordMatch = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)
    if (!user || !passwordMatch) {
      throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.')
    }

    const { token, expiresAt } = await issueDesktopToken(user.id)
    return ok({ token, expiresAt: expiresAt.toISOString(), user: serializeUser(user) })
  } catch (e) {
    return fail(e)
  }
}
