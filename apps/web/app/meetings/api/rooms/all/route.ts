import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!canManageMeetingRooms(auth.user.role)) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

  const rooms = await prisma.meetingRoom.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          meetings: {
            where: {
              status: { notIn: ['cancelled', 'completed'] },
              endAt: { gte: new Date() },
            },
          },
        },
      },
    },
  })

  return successResponse(
    rooms.map((room) => ({
      id: room.id,
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      location: room.location,
      equipment: room.equipment,
      isActive: room.isActive,
      meetingsCount: room._count?.meetings ?? 0,
    }))
  )
}
