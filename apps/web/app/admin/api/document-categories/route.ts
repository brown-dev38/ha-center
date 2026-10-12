import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { prisma } from '@/app/common/server/prisma'
import { requireRole, getClientIp } from '@/app/auth/server/route-auth'
import { writeAuditLog } from '@/app/admin/server/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const categories = await prisma.documentCategory.findMany({
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }],
      include: { _count: { select: { documents: true } } },
    })

    return successResponse(
      categories.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        documentCount: c._count.documents,
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
      description?: string
      sortOrder?: number
    }
    const code = body.code?.trim()
    const name = body.name?.trim()
    if (!code) return errorResponse(422, 'กรุณาระบุรหัสหมวดหมู่', 'VALIDATION_ERROR')
    if (!name) return errorResponse(422, 'กรุณาระบุชื่อหมวดหมู่', 'VALIDATION_ERROR')

    const existing = await prisma.documentCategory.findUnique({ where: { code } })
    if (existing) return errorResponse(409, 'รหัสหมวดหมู่นี้มีอยู่แล้ว', 'DUPLICATE_CODE')

    const created = await prisma.documentCategory.create({
      data: {
        code,
        name,
        description: body.description?.trim() || null,
        sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
      },
    })

    await writeAuditLog({
      userId: auth.auth.user.id,
      action: 'DOC_CATEGORY_CREATED',
      entity: 'document_category',
      entityId: created.id,
      newData: { code, name },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return successResponse(created, 'เพิ่มหมวดหมู่แล้ว')
  })
}
