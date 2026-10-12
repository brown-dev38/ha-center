import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canManageMeetingRooms } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'
import { fetchMeetingFull, mapMeetingDetail } from '@/app/meetings/server/meetings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function canManageMeeting(role: string, organizerId: string, userId: string) {
  return canManageMeetingRooms(role) || organizerId === userId
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

  let body: { status?: string }
  try {
    body = (await request.json()) as { status?: string }
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }
  if (!body.status) return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')

  await prisma.meeting.update({ where: { id }, data: { status: body.status } })
  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!))
}
