import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'
import { formatUserName } from '@/app/meetings/server/meetings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!(hasPermission(auth.user.role, 'meetings:write') || hasPermission(auth.user.role, 'admin:stats'))) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

  const { searchParams } = new URL(request.url)
  const departmentId = searchParams.get('departmentId')

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(departmentId ? { departmentId } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: { select: { id: true, code: true, name: true } },
      role: { select: { displayName: true } },
    },
    orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }, { lastName: 'asc' }],
  })

  return successResponse(
    users.map((u) => ({
      id: u.id,
      name: formatUserName(u.firstName, u.lastName) || 'ไม่ระบุชื่อ',
      departmentId: u.department?.id ?? null,
      departmentName: u.department?.name ?? null,
      departmentCode: u.department?.code ?? null,
      positionTitle: u.jobTitle ?? u.role.displayName ?? null,
    }))
  )
}
