import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'
import { checkRoomAvailability } from '@/app/meetings/server/meetings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')

  const rooms = await prisma.meetingRoom.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  if (!date || !startTime || !endTime) {
    return successResponse(
      rooms.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        capacity: r.capacity,
        location: r.location,
        equipment: r.equipment,
        isAvailable: true,
      }))
    )
  }

  const startAt = new Date(`${date}T${startTime}`)
  const endAt = new Date(`${date}T${endTime}`)

  const result = await Promise.all(
    rooms.map(async (room) => {
      const { available, conflict } = await checkRoomAvailability(room.id, startAt, endAt)
      return {
        id: room.id,
        name: room.name,
        code: room.code,
        capacity: room.capacity,
        location: room.location,
        equipment: room.equipment,
        isAvailable: available,
        ...(conflict ? { conflictingMeetings: [conflict.title] } : {}),
      }
    })
  )

  return successResponse(result)
}

type UpsertRoomBody = {
  name?: string
  code?: string
  capacity?: number
  location?: string
  equipment?: string
  isActive?: boolean
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!canManageMeetingRooms(auth.user.role)) return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')

  let body: UpsertRoomBody
  try {
    body = (await request.json()) as UpsertRoomBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.name || !body.code) return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')

  const codeNorm = body.code.trim().toUpperCase()
  const existing = await prisma.meetingRoom.findUnique({ where: { code: codeNorm } })
  if (existing) return errorResponse(409, 'รหัสห้องนี้มีอยู่แล้ว', 'ROOM_CODE_EXISTS')

  const room = await prisma.meetingRoom.create({
    data: {
      name: body.name,
      code: codeNorm,
      capacity: body.capacity,
      location: body.location,
      equipment: body.equipment,
      isActive: body.isActive ?? true,
    },
  })

  return successResponse(room, 'เพิ่มห้องประชุมสำเร็จ')
}
