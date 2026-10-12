import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'
import { checkRoomAvailability, fetchMeetingFull, mapMeetingDetail, mapMeetingListItem } from '@/app/meetings/server/meetings'
import { hasPermission } from '@/app/common/server/permissions'
import { normalizeParticipantItems, replaceMeetingParticipants, type ParticipantBodyItem } from '@/app/meetings/server/meeting-participants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const roomId = searchParams.get('roomId')

  const where: Record<string, unknown> = {}

  if (month && year) {
    where.startAt = {
      gte: new Date(Number(year), Number(month) - 1, 1),
      lte: new Date(Number(year), Number(month), 0, 23, 59, 59, 999),
    }
  } else if (year) {
    where.startAt = {
      gte: new Date(Number(year), 0, 1),
      lte: new Date(Number(year), 11, 31, 23, 59, 59, 999),
    }
  }

  if (status) where.status = status
  if (type) where.type = type
  if (roomId) where.roomId = roomId

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      room: true,
      organizer: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  return successResponse(meetings.map(mapMeetingListItem))
}

type CreateMeetingBody = {
  title?: string
  type?: string
  roomId?: string
  startDatetime?: string
  endDatetime?: string
  description?: string
  participantIds?: string[]
  participants?: ParticipantBodyItem[]
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!hasPermission(auth.user.role, 'meetings:write')) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

  let body: CreateMeetingBody
  try {
    body = (await request.json()) as CreateMeetingBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.title || !body.type || !body.startDatetime || !body.endDatetime) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const startAt = new Date(body.startDatetime)
  const endAt = new Date(body.endDatetime)
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return errorResponse(422, 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม', 'VALIDATION_ERROR')
  }

  if (body.roomId) {
    const { available, conflict } = await checkRoomAvailability(body.roomId, startAt, endAt)
    if (!available) {
      return errorResponse(
        409,
        `ห้องประชุมไม่ว่างในช่วงเวลานี้${conflict ? `: ${conflict.title}` : ''}`,
        'ROOM_NOT_AVAILABLE'
      )
    }
  }

  const meeting = await prisma.$transaction(async (tx) => {
    const created = await tx.meeting.create({
      data: {
        title: body.title!,
        type: body.type!,
        description: body.description,
        roomId: body.roomId,
        organizerId: auth.user.id,
        startAt,
        endAt,
        bookingStatus: 'confirmed',
      },
    })

    const participantItems = normalizeParticipantItems(body.participants, body.participantIds)
    if (participantItems.length > 0) {
      await replaceMeetingParticipants(tx, created.id, participantItems)
    }

    return created
  })

  const full = await fetchMeetingFull(meeting.id)
  if (!full) {
    return errorResponse(500, 'สร้างการประชุมแล้วแต่โหลดรายละเอียดไม่สำเร็จ', 'INTERNAL_ERROR')
  }

  return successResponse(mapMeetingDetail(full), 'สร้างการประชุมสำเร็จ')
}
