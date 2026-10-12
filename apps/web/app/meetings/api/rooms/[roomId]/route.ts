import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ roomId: string }> }

type UpdateBody = {
  name?: string
  code?: string
  capacity?: number
  location?: string
  equipment?: string
  isActive?: boolean
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!canManageMeetingRooms(auth.user.role)) return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')

  const { roomId } = await ctx.params
  const room = await prisma.meetingRoom.findUnique({ where: { id: roomId } })
  if (!room) return errorResponse(404, 'ไม่พบห้องประชุม', 'ROOM_NOT_FOUND')

  let body: UpdateBody
  try {
    body = (await request.json()) as UpdateBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (body.code) {
    const codeNorm = body.code.trim().toUpperCase()
    if (codeNorm !== room.code) {
      const dup = await prisma.meetingRoom.findUnique({ where: { code: codeNorm } })
      if (dup) return errorResponse(409, 'รหัสห้องนี้มีอยู่แล้ว', 'ROOM_CODE_EXISTS')
    }
  }

  const updated = await prisma.meetingRoom.update({
    where: { id: roomId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.code !== undefined ? { code: body.code.trim().toUpperCase() } : {}),
      ...(body.capacity !== undefined ? { capacity: body.capacity } : {}),
      ...(body.location !== undefined ? { location: body.location } : {}),
      ...(body.equipment !== undefined ? { equipment: body.equipment } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  })

  return successResponse(updated, 'บันทึกห้องประชุมสำเร็จ')
}
