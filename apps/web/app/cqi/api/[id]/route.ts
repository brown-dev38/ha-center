import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { mapCqiDetail, parseCqiInput } from '@/app/cqi/server/cqi'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const project = await prisma.cqiProject.findFirst({
    where: { id, isActive: true },
    include: {
      department: true,
      lead: { select: { id: true, firstName: true, lastName: true, email: true } },
      awards: { orderBy: { awardedAt: 'desc' } },
    },
  })

  if (!project) return errorResponse(404, 'ไม่พบโครงการ CQI', 'CQI_NOT_FOUND')
  return successResponse(mapCqiDetail(project))
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'cqi:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์แก้ไขโครงการ CQI', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.cqiProject.findFirst({ where: { id, isActive: true } })
    if (!existing) return errorResponse(404, 'ไม่พบโครงการ CQI', 'CQI_NOT_FOUND')

    const body = await request.json().catch(() => null)
    const parsed = parseCqiInput(body)
    if (!parsed.ok) return errorResponse(422, parsed.error, 'VALIDATION_ERROR')

    await prisma.cqiProject.update({ where: { id }, data: parsed.data })
    return successResponse({ id }, 'บันทึกการแก้ไขสำเร็จ')
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'cqi:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์ลบโครงการ CQI', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.cqiProject.findFirst({ where: { id, isActive: true } })
    if (!existing) return errorResponse(404, 'ไม่พบโครงการ CQI', 'CQI_NOT_FOUND')

    await prisma.cqiProject.update({ where: { id }, data: { isActive: false } })
    return successResponse({ id }, 'ลบโครงการสำเร็จ')
  })
}
