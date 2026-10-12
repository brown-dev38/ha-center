import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'
import { fetchMeetingFull, mapMeetingDetail } from '@/app/meetings/server/meetings'
import { normalizeParticipantItems, replaceMeetingParticipants, type ParticipantBodyItem } from '@/app/meetings/server/meeting-participants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function canManageMeeting(role: string, organizerId: string, userId: string) {
  return canManageMeetingRooms(role) || organizerId === userId
}

type Body = {
  participantIds?: string[]
  participants?: ParticipantBodyItem[]
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id } = await ctx.params
  const existing = await prisma.meeting.findUnique({ where: { id } })
  if (!existing) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')
  if (!canManageMeeting(auth.user.role, existing.organizerId, auth.user.id)) {
    return errorResponse(403, 'ไม่มีสิทธิ์จัดการการประชุมนี้', 'MEETING_FORBIDDEN')
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const participantItems = normalizeParticipantItems(body.participants, body.participantIds)
  await prisma.$transaction(async (tx) => {
    await replaceMeetingParticipants(tx, id, participantItems)
  })

  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!), 'อัปเดตผู้เข้าร่วมแล้ว')
}
