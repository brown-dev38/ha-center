import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, requireAuthUser, type AuthenticatedUser } from '@/app/auth/server/auth-user'

const STAFF_PLUS = ['staff', 'qa_manager', 'admin'] as const

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

type AuthResult = {
  token: { sub: string; role: string }
  user: AuthenticatedUser
}

export async function requireAuth(
  request: NextRequest
): Promise<{ auth: AuthResult } | { error: NextResponse }> {
  const auth = await requireAuthUser(request)
  if (!auth) {
    return { error: errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED') }
  }
  return { auth }
}

export async function requireRole(
  request: NextRequest,
  ...roles: string[]
): Promise<{ auth: AuthResult } | { error: NextResponse }> {
  const result = await requireAuth(request)
  if ('error' in result) return result
  if (!roles.includes(result.auth.user.role)) {
    return { error: errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN') }
  }
  return result
}

export async function requireStaffPlus(
  request: NextRequest
): Promise<{ auth: AuthResult } | { error: NextResponse }> {
  return requireRole(request, ...STAFF_PLUS)
}
