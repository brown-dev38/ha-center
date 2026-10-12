import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { saveMeetingMinutesPdf } from '@/app/meetings/server/meeting-storage'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id } = await ctx.params
  const meeting = await prisma.meeting.findUnique({ where: { id } })
  if (!meeting) return errorResponse(404, 'ไม่พบการประชุม', 'MEETING_NOT_FOUND')

  const form = await request.formData()
  const file = form.get('file')
  const summary = form.get('summary')
  if (!(file instanceof File)) return errorResponse(422, 'ไม่พบไฟล์ PDF', 'VALIDATION_ERROR')

  const stored = await saveMeetingMinutesPdf(id, file)
  if (!stored.ok) return errorResponse(422, stored.error, stored.code)

  const minute = await prisma.meetingMinute.create({
    data: {
      meetingId: id,
      summary: typeof summary === 'string' ? summary : null,
      filePath: stored.filePath,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      authorId: auth.user.id,
    },
  })

  return successResponse(
    {
      id: minute.id,
      summary: minute.summary,
      pdfPath: `/api/v1/meetings/${id}/minutes/${minute.id}/file`,
    },
    'อัปโหลดรายงานการประชุมสำเร็จ'
  )
}
