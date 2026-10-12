import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { isAdminRole } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const VALID_STATUS = ['new', 'in_progress', 'done', 'archived']

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!isAdminRole(auth.user.role)) {
      return errorResponse(403, 'เฉพาะผู้ดูแลระบบ', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.consultRequest.findUnique({ where: { id } })
    if (!existing) return errorResponse(404, 'ไม่พบคำขอ', 'NOT_FOUND')

    const body = await request.json().catch(() => null)
    const b = (body ?? {}) as Record<string, unknown>

    const data: { status?: string; note?: string | null; handledBy?: string } = {}
    if (typeof b.status === 'string') {
      if (!VALID_STATUS.includes(b.status)) {
        return errorResponse(422, 'สถานะไม่ถูกต้อง', 'VALIDATION_ERROR')
      }
      data.status = b.status
      data.handledBy = auth.user.id
    }
    if (typeof b.note === 'string') {
      data.note = b.note.trim() || null
    }

    const updated = await prisma.consultRequest.update({ where: { id }, data })
    return successResponse(updated, 'อัปเดตคำขอสำเร็จ')
  })
}
