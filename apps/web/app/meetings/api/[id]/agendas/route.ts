import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')

  const agendas = await prisma.meetingAgenda.findMany({
    where: { meetingId: id },
    orderBy: { orderNo: 'asc' },
    include: { presenter: { select: { id: true, firstName: true, lastName: true } } },
  })

  return successResponse(
    agendas.map((a) => ({
      id: a.id,
      title: a.title,
      orderNo: a.orderNo,
      durationMinutes: a.durationMinutes,
      presenterId: a.presenterId,
      presenterName: a.presenter ? `${a.presenter.firstName} ${a.presenter.lastName}`.trim() : a.presenterName,
      actualDurationSeconds: a.actualDurationSeconds,
      timerStatus: a.timerStatus,
      hasAttachment: !!a.attachmentPath,
      attachmentFileName: a.attachmentFileName,
      attachmentPath: a.attachmentPath ? `/api/v1/meetings/${id}/agendas/${a.id}/file` : null,
    }))
  )
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id } = await ctx.params
  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')

  let body: { title?: string; orderNo?: number; durationMinutes?: number; presenterId?: string }
  try {
    body = (await request.json()) as { title?: string; orderNo?: number; durationMinutes?: number; presenterId?: string }
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.title || !body.orderNo) return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')

  const agenda = await prisma.meetingAgenda.create({
    data: {
      meetingId: id,
      title: body.title,
      orderNo: body.orderNo,
      sortOrder: body.orderNo,
      durationMinutes: body.durationMinutes,
      presenterId: body.presenterId,
    },
    include: { presenter: { select: { id: true, firstName: true, lastName: true } } },
  })

  return successResponse({
    id: agenda.id,
    title: agenda.title,
    orderNo: agenda.orderNo,
    durationMinutes: agenda.durationMinutes,
    presenterId: agenda.presenterId,
    presenterName: agenda.presenter ? `${agenda.presenter.firstName} ${agenda.presenter.lastName}`.trim() : null,
    actualDurationSeconds: agenda.actualDurationSeconds,
    timerStatus: agenda.timerStatus,
  })
}
