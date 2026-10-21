import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import * as z from 'zod'
import type { NextRequest } from 'next/server'
import { db } from '@/app/lib/db'
import { ApiError } from '@/app/lib/api/errors'
import type { UserRow } from '@/app/lib/api/serialize'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

const AUDIENCE = 'ritsu-desktop'
const ISSUER = 'ritsu'
const TOKEN_TTL_SECONDS = 12 * 60 * 60

// The payload deliberately has no userId or role. decrypt() in session.ts
// reads payload.userId, so a desktop token can't pass as a web session cookie,
// and the role is always read fresh from the database.
export async function issueDesktopToken(userId: string) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + TOKEN_TTL_SECONDS
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuer(ISSUER)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(encodedKey)
  return { token, expiresAt: new Date(exp * 1000) }
}

export async function requireApiUser(
  req: NextRequest,
  { roles }: { roles?: string[] } = {}
): Promise<UserRow> {
  const match = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)
  if (!match) throw new ApiError('UNAUTHORIZED', 'Missing bearer token.')

  // Web session cookies have no aud/iss, so they fail here.
  let subject: string | undefined
  try {
    const { payload } = await jwtVerify(match[1], encodedKey, {
      algorithms: ['HS256'],
      audience: AUDIENCE,
      issuer: ISSUER,
      requiredClaims: ['sub', 'iat', 'exp'],
    })
    subject = payload.sub
  } catch {
    throw new ApiError('UNAUTHORIZED', 'Invalid or expired token.')
  }

  const userId = z.uuid().safeParse(subject)
  if (!userId.success) throw new ApiError('UNAUTHORIZED', 'Invalid or expired token.')

  const result = await db.query<UserRow>(
    'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
    [userId.data]
  )
  const user = result.rows[0]
  if (!user) throw new ApiError('UNAUTHORIZED', 'User no longer exists.')

  if (roles && !roles.includes(user.role)) {
    throw new ApiError('FORBIDDEN', 'You do not have access to this resource.')
  }

  return user
}
