import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from '@/app/lib/session'
import { db } from '@/app/lib/db'

export type User = {
  id: string
  username: string
  email: string
  role: string
  driving_license_image: string | null
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/auth/login')
  }

  return { isAuth: true, userId: session.userId, role: session.role }
})

export const getUser = cache(async (): Promise<User | null> => {
  const session = await verifySession()
  if (!session) return null

  try {
    const result = await db.query<User>(
      'SELECT id, username, email, role, driving_license_image FROM users WHERE id = $1',
      [session.userId]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
})

// Like getUser but never redirects — returns null for unauthenticated visitors.
export const getOptionalUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get('session')?.value
    const session = await decrypt(cookie)
    if (!session?.userId) return null

    const result = await db.query<User>(
      'SELECT id, username, email, role, driving_license_image FROM users WHERE id = $1',
      [session.userId]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
})
