import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ roomId: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!canManageMeetingRooms(auth.user.role)) return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')

  const { roomId } = await ctx.params
  const room = await prisma.meetingRoom.findUnique({ where: { id: roomId } })
  if (!room) return errorResponse(404, 'ไม่พบห้องประชุม', 'ROOM_NOT_FOUND')

  let body: { isActive?: boolean } = {}
  try {
    body = (await request.json()) as { isActive?: boolean }
  } catch {
    body = {}
  }

  const nextActive = body.isActive ?? !room.isActive

  if (!nextActive) {
    const activeMeetings = await prisma.meeting.count({
      where: {
        roomId,
        status: { notIn: ['cancelled', 'completed'] },
        endAt: { gte: new Date() },
      },
    })
    if (activeMeetings > 0) {
      return errorResponse(409, 'ไม่สามารถปิดใช้งานได้ มีการประชุมที่ยังไม่เสร็จในห้องนี้', 'ROOM_HAS_MEETINGS')
    }
  }

  const updated = await prisma.meetingRoom.update({
    where: { id: roomId },
    data: { isActive: nextActive },
  })

  return successResponse(updated, nextActive ? 'เปิดใช้งานห้องแล้ว' : 'ปิดใช้งานห้องแล้ว')
}
