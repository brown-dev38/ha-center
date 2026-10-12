import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { fetchMeetingFull, mapMeetingDetail } from '@/app/meetings/server/meetings'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id } = await ctx.params
  const existing = await prisma.meeting.findUnique({ where: { id } })
  if (!existing) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')

  let body: { status?: string; notes?: string }
  try {
    body = (await request.json()) as { status?: string; notes?: string }
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }
  if (!body.status) return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')

  await prisma.meeting.update({
    where: { id },
    data: {
      preparationStatus: body.status,
      ...(body.notes !== undefined ? { preparationNotes: body.notes } : {}),
    },
  })

  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!))
}
