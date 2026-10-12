import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [],
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname
      const isPublic =
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/api/auth') ||
        path === '/auth/api/config' ||
        path.startsWith('/auth/api/login') ||
        path.startsWith('/auth/api/microsoft') ||
        path === '/api/health' ||
        path === '/common/health' ||
        path.startsWith('/auth/callback') ||
        path === '/system-rls' ||
        path.startsWith('/system-rls/')
      if (isPublic) return true
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig


