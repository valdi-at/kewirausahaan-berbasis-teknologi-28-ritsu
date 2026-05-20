import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/app/lib/session'

const protectedPrefixes = ['/places', '/booking', '/chat', '/profile', '/driver', '/admin']
const authOnlyPaths = ['/auth/login', '/auth/register']

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  const isAuthOnly = authOnlyPaths.some((p) => pathname.startsWith(p))

  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)
  const isLoggedIn = !!session?.userId

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl))
  }

  if (isAuthOnly && isLoggedIn) {
    return NextResponse.redirect(new URL('/home', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
