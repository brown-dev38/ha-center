import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!(hasPermission(auth.user.role, 'meetings:write') || hasPermission(auth.user.role, 'admin:stats'))) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true },
  })
  return successResponse(departments)
}
