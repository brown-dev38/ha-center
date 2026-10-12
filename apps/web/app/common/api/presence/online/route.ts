import { successResponse } from '@/app/auth/server/auth-user'
import { getOnlineUsers } from '@/app/common/server/presence-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const users = getOnlineUsers().map((e) => ({
    userId: e.userId,
    name: e.name,
    email: e.email,
    role: e.role,
    roleLabel: e.roleLabel,
    departmentName: e.departmentName,
    avatarUrl: e.avatarUrl,
    page: e.page,
    ipAddress: e.ipAddress,
    lastSeenAt: new Date(e.lastSeenAt).toISOString(),
    loginAt: new Date(e.loginAt).toISOString(),
    secondsSinceLastSeen: Math.floor((Date.now() - e.lastSeenAt) / 1000),
  }))

  return successResponse({ count: users.length, users })
}
