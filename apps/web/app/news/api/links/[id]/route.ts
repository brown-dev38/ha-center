import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { isAdminRole } from '@/app/common/server/permissions'
import { parseRelatedLinkInput } from '@/app/links/server/related-links'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!isAdminRole(auth.user.role)) {
      return errorResponse(403, 'เฉพาะผู้ดูแลระบบ', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.relatedLink.findUnique({ where: { id } })
    if (!existing) return errorResponse(404, 'ไม่พบลิงก์', 'NOT_FOUND')

    const body = await request.json().catch(() => null)
    const parsed = parseRelatedLinkInput(body)
    if (!parsed.ok) return errorResponse(422, parsed.error, 'VALIDATION_ERROR')

    const link = await prisma.relatedLink.update({ where: { id }, data: parsed.data })
    return successResponse(link, 'บันทึกการแก้ไขสำเร็จ')
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!isAdminRole(auth.user.role)) {
      return errorResponse(403, 'เฉพาะผู้ดูแลระบบ', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.relatedLink.findUnique({ where: { id } })
    if (!existing) return errorResponse(404, 'ไม่พบลิงก์', 'NOT_FOUND')

    await prisma.relatedLink.update({ where: { id }, data: { isActive: false } })
    return successResponse({ id }, 'ลบลิงก์สำเร็จ')
  })
}
