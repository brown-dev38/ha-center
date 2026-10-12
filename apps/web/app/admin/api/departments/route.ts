import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { prisma } from '@/app/common/server/prisma'
import { requireRole, getClientIp } from '@/app/auth/server/route-auth'
import { writeAuditLog } from '@/app/admin/server/audit'
import { formatDepartmentId } from '@/app/admin/server/department-id'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const departments = await prisma.department.findMany({
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        isActive: true,
        _count: { select: { users: true } },
      },
    })

    return successResponse(
      departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        nameEn: d.nameEn,
        isActive: d.isActive,
        usersCount: d._count.users,
      }))
    )
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const body = (await request.json()) as {
      code?: string
      name?: string
      nameEn?: string
    }
    const code = body.code?.trim()
    const name = body.name?.trim()
    if (!code) return errorResponse(422, 'กรุณาระบุรหัสแผนก', 'VALIDATION_ERROR')
    if (!name) return errorResponse(422, 'กรุณาระบุชื่อแผนก', 'VALIDATION_ERROR')

    const existing = await prisma.department.findUnique({ where: { code } })
    if (existing) return errorResponse(409, 'รหัสแผนกนี้มีอยู่แล้ว', 'DUPLICATE_CODE')

    const dept = await prisma.department.create({
      data: {
        id: formatDepartmentId(code),
        code,
        name,
        nameEn: body.nameEn?.trim() || null,
      },
    })

    await writeAuditLog({
      userId: auth.auth.user.id,
      action: 'DEPARTMENT_CREATED',
      entity: 'department',
      entityId: dept.id,
      newData: { code, name },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse(dept, 'เพิ่มแผนกแล้ว')
  })
}
