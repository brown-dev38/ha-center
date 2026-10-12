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
  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')

  let body: { agendas?: Array<{ id?: string; title: string; orderNo: number; durationMinutes?: number; presenterId?: string; description?: string }> }
  try {
    body = (await request.json()) as { agendas?: Array<{ id?: string; title: string; orderNo: number; durationMinutes?: number; presenterId?: string; description?: string }> }
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const agendas = body.agendas ?? []
  const existing = await prisma.meetingAgenda.findMany({ where: { meetingId: id } })
  const keepIds = new Set(agendas.map((a) => a.id).filter((v): v is string => !!v))

  await prisma.$transaction(async (tx) => {
    for (const item of agendas) {
      if (item.id && existing.some((e) => e.id === item.id)) {
        await tx.meetingAgenda.update({
          where: { id: item.id },
          data: {
            title: item.title,
            orderNo: item.orderNo,
            sortOrder: item.orderNo,
            durationMinutes: item.durationMinutes,
            presenterId: item.presenterId,
            description: item.description,
          },
        })
      } else {
        await tx.meetingAgenda.create({
          data: {
            meetingId: id,
            title: item.title,
            orderNo: item.orderNo,
            sortOrder: item.orderNo,
            durationMinutes: item.durationMinutes,
            presenterId: item.presenterId,
            description: item.description,
          },
        })
      }
    }

    const toRemove = existing.filter((e) => !keepIds.has(e.id))
    if (toRemove.length > 0) {
      await tx.meetingAgenda.deleteMany({ where: { id: { in: toRemove.map((e) => e.id) } } })
    }
  })

  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!), 'บันทึกวาระการประชุมสำเร็จ')
}
