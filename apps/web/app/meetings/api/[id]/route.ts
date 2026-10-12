import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'
import { checkRoomAvailability, fetchMeetingFull, mapMeetingDetail } from '@/app/meetings/server/meetings'
import { normalizeParticipantItems, replaceMeetingParticipants, type ParticipantBodyItem } from '@/app/meetings/server/meeting-participants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function canManageMeeting(role: string, organizerId: string, userId: string) {
  return canManageMeetingRooms(role) || organizerId === userId
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const meeting = await fetchMeetingFull(id)
  if (!meeting) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')
  return successResponse(mapMeetingDetail(meeting))
}

type UpdateMeetingBody = {
  title?: string
  type?: string
  description?: string
  roomId?: string
  startDatetime?: string
  endDatetime?: string
  participantIds?: string[]
  participants?: ParticipantBodyItem[]
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id } = await ctx.params
  const existing = await prisma.meeting.findUnique({ where: { id } })
  if (!existing) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')
  if (!canManageMeeting(auth.user.role, existing.organizerId, auth.user.id)) {
    return errorResponse(403, 'ไม่มีสิทธิ์จัดการการประชุมนี้', 'MEETING_FORBIDDEN')
  }

  let body: UpdateMeetingBody
  try {
    body = (await request.json()) as UpdateMeetingBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const startAt = body.startDatetime ? new Date(body.startDatetime) : existing.startAt
  const endAt = body.endDatetime ? new Date(body.endDatetime) : existing.endAt
  const roomId = body.roomId !== undefined ? body.roomId : existing.roomId

  if (endAt <= startAt) {
    return errorResponse(422, 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม', 'VALIDATION_ERROR')
  }

  if (roomId) {
    const { available, conflict } = await checkRoomAvailability(roomId, startAt, endAt, id)
    if (!available) {
      return errorResponse(
        409,
        `ห้องประชุมไม่ว่างในช่วงเวลานี้${conflict ? `: ${conflict.title}` : ''}`,
        'ROOM_NOT_AVAILABLE'
      )
    }
  }

  await prisma.meeting.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.roomId !== undefined ? { roomId: body.roomId } : {}),
      ...(body.startDatetime !== undefined ? { startAt } : {}),
      ...(body.endDatetime !== undefined ? { endAt } : {}),
    },
  })

  if (body.participants !== undefined || body.participantIds !== undefined) {
    const participantItems = normalizeParticipantItems(body.participants, body.participantIds)
    await prisma.$transaction(async (tx) => {
      await replaceMeetingParticipants(tx, id, participantItems)
    })
  }

  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id } = await ctx.params
  const existing = await prisma.meeting.findUnique({ where: { id } })
  if (!existing) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')
  if (!canManageMeeting(auth.user.role, existing.organizerId, auth.user.id)) {
    return errorResponse(403, 'ไม่มีสิทธิ์จัดการการประชุมนี้', 'MEETING_FORBIDDEN')
  }

  await prisma.meeting.delete({ where: { id } })
  return successResponse({ ok: true }, 'ลบการประชุมสำเร็จ')
}
