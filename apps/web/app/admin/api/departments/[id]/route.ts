import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { prisma } from '@/app/common/server/prisma'
import { requireRole, getClientIp } from '@/app/auth/server/route-auth'
import { writeAuditLog } from '@/app/admin/server/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) return errorResponse(404, 'ไม่พบแผนก', 'NOT_FOUND')

    const body = (await request.json()) as {
      code?: string
      name?: string
      nameEn?: string | null
      isActive?: boolean
    }

    if (body.code && body.code.trim() !== existing.code) {
      const dup = await prisma.department.findUnique({ where: { code: body.code.trim() } })
      if (dup) return errorResponse(409, 'รหัสแผนกนี้มีอยู่แล้ว', 'DUPLICATE_CODE')
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(body.code ? { code: body.code.trim() } : {}),
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.nameEn !== undefined ? { nameEn: body.nameEn?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    })

    await writeAuditLog({
      userId: auth.auth.user.id,
      action: 'DEPARTMENT_UPDATED',
      entity: 'department',
      entityId: id,
      oldData: { code: existing.code, name: existing.name, isActive: existing.isActive },
      newData: { code: updated.code, name: updated.name, isActive: updated.isActive },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse(updated, 'บันทึกแผนกแล้ว')
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    })
    if (!existing) return errorResponse(404, 'ไม่พบแผนก', 'NOT_FOUND')
    if (existing._count.users > 0) {
      return errorResponse(422, 'แผนกนี้ยังมีผู้ใช้อยู่ — ปิดใช้งานแทนการลบ', 'DEPARTMENT_IN_USE')
    }

    await prisma.department.update({ where: { id }, data: { isActive: false } })

    await writeAuditLog({
      userId: auth.auth.user.id,
      action: 'DEPARTMENT_DEACTIVATED',
      entity: 'department',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse(null, 'ปิดใช้งานแผนกแล้ว')
  })
}
