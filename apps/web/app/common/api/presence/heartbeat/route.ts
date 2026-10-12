import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { getOnlineCount, touchPresence } from '@/app/common/server/presence-store'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  let body: { page?: string } = {}
  try {
    body = (await request.json()) as { page?: string }
  } catch {
    body = {}
  }

  const { user } = auth
  const name = `${user.firstName} ${user.lastName}`.trim() || user.email
  const entry = touchPresence({
    userId: user.id,
    name,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    departmentName: user.departmentName,
    avatarUrl: user.avatarUrl,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
    page: body.page ?? null,
  })

  return successResponse({
    ok: true,
    onlineCount: getOnlineCount(),
    lastSeenAt: new Date(entry.lastSeenAt).toISOString(),
  })
}
