import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

const NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate'

export const proxy = auth((request) => {
  const response = NextResponse.next()

  const path = request.nextUrl.pathname
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/')) {
    response.headers.set('Cache-Control', NO_STORE)
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('X-HA-API', 'web-native')
  }

  return response
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|system-rls|system-rls/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
