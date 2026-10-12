import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; agendaId: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id, agendaId } = await ctx.params
  const agenda = await prisma.meetingAgenda.findFirst({ where: { id: agendaId, meetingId: id } })
  if (!agenda) return errorResponse(404, 'ไม่พบวาระการประชุม', 'AGENDA_NOT_FOUND')

  let body: { actualDurationSeconds?: number; status?: string }
  try {
    body = (await request.json()) as { actualDurationSeconds?: number; status?: string }
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (typeof body.actualDurationSeconds !== 'number' || !body.status) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const updated = await prisma.meetingAgenda.update({
    where: { id: agendaId },
    data: { actualDurationSeconds: body.actualDurationSeconds, timerStatus: body.status },
    include: { presenter: { select: { id: true, firstName: true, lastName: true } } },
  })

  return successResponse({
    id: updated.id,
    title: updated.title,
    orderNo: updated.orderNo,
    durationMinutes: updated.durationMinutes,
    presenterId: updated.presenterId,
    presenterName: updated.presenter
      ? `${updated.presenter.firstName} ${updated.presenter.lastName}`.trim()
      : updated.presenterName,
    actualDurationSeconds: updated.actualDurationSeconds,
    timerStatus: updated.timerStatus,
  })
}
