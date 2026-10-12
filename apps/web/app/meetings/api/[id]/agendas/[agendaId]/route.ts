import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { fetchMeetingFull, mapMeetingDetail } from '@/app/meetings/server/meetings'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; agendaId: string }> }

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id, agendaId } = await ctx.params
  const agenda = await prisma.meetingAgenda.findFirst({ where: { id: agendaId, meetingId: id } })
  if (!agenda) return errorResponse(404, 'ไม่พบวาระการประชุม', 'AGENDA_NOT_FOUND')

  await prisma.meetingAgenda.delete({ where: { id: agendaId } })
  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!), 'ลบวาระแล้ว')
}
