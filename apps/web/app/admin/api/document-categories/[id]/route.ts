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
    const existing = await prisma.documentCategory.findUnique({ where: { id } })
    if (!existing) return errorResponse(404, 'ไม่พบหมวดหมู่', 'NOT_FOUND')

    const body = (await request.json()) as {
      code?: string
      name?: string
      description?: string | null
      sortOrder?: number
      isActive?: boolean
    }

    if (body.code && body.code.trim() !== existing.code) {
      const dup = await prisma.documentCategory.findUnique({ where: { code: body.code.trim() } })
      if (dup) return errorResponse(409, 'รหัสหมวดหมู่นี้มีอยู่แล้ว', 'DUPLICATE_CODE')
    }

    const updated = await prisma.documentCategory.update({
      where: { id },
      data: {
        ...(body.code ? { code: body.code.trim() } : {}),
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    })

    await writeAuditLog({
      userId: auth.auth.user.id,
      action: 'DOC_CATEGORY_UPDATED',
      entity: 'document_category',
      entityId: id,
      oldData: { code: existing.code, name: existing.name, isActive: existing.isActive },
      newData: { code: updated.code, name: updated.name, isActive: updated.isActive },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse(updated, 'บันทึกหมวดหมู่แล้ว')
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await prisma.documentCategory.findUnique({
      where: { id },
      include: { _count: { select: { documents: true } } },
    })
    if (!existing) return errorResponse(404, 'ไม่พบหมวดหมู่', 'NOT_FOUND')
    if (existing._count.documents > 0) {
      return errorResponse(422, 'หมวดหมู่นี้ยังมีเอกสารอยู่ — ปิดใช้งานแทนการลบ', 'CATEGORY_IN_USE')
    }

    await prisma.documentCategory.update({ where: { id }, data: { isActive: false } })

    await writeAuditLog({
      userId: auth.auth.user.id,
      action: 'DOC_CATEGORY_DEACTIVATED',
      entity: 'document_category',
      entityId: id,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse(null, 'ปิดใช้งานหมวดหมู่แล้ว')
  })
}
