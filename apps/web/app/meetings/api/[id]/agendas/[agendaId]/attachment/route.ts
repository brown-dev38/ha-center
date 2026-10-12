import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { isFileLinkMode } from '@/app/auth/server/file-link-mode'
import { fetchMeetingFull, mapMeetingDetail } from '@/app/meetings/server/meetings'
import { saveMeetingAgendaPdf } from '@/app/meetings/server/meeting-storage'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; agendaId: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const { id, agendaId } = await ctx.params
  const agenda = await prisma.meetingAgenda.findFirst({ where: { id: agendaId, meetingId: id } })
  if (!agenda) return errorResponse(404, 'ไม่พบวาระการประชุม', 'AGENDA_NOT_FOUND')

  const linkOnly = isFileLinkMode('meetings')
  const contentType = request.headers.get('content-type') ?? ''
  let file: File | null = null
  let fileUrl = ''

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { fileUrl?: string }
    fileUrl = String(body.fileUrl ?? '').trim()
  } else {
    const form = await request.formData()
    const rawFile = form.get('file')
    if (rawFile instanceof File) file = rawFile
    fileUrl = String(form.get('fileUrl') ?? '').trim()
  }

  if (linkOnly && file && file.size > 0) {
    return errorResponse(422, 'โหมดประชุมใช้แนบลิงก์ Google Drive เท่านั้น', 'MEETING_LINK_ONLY')
  }
  if (fileUrl && file && file.size > 0) {
    return errorResponse(422, 'เลือกได้เฉพาะลิงก์หรือไฟล์อย่างใดอย่างหนึ่ง', 'VALIDATION_ERROR')
  }

  const stored = fileUrl
    ? saveMeetingAgendaFromLink(fileUrl)
    : file && file.size > 0
      ? await saveMeetingAgendaPdf(id, agendaId, file)
      : null

  if (!stored) {
    return errorResponse(422, linkOnly ? 'กรุณาวางลิงก์ Google Drive' : 'ไม่พบไฟล์ PDF', 'VALIDATION_ERROR')
  }
  if (!stored.ok) return errorResponse(422, stored.error, stored.code)

  await prisma.meetingAgenda.update({
    where: { id: agendaId },
    data: {
      attachmentPath: stored.filePath,
      attachmentFileName: stored.fileName,
      attachmentFileSize: stored.fileSize,
    },
  })

  const full = await fetchMeetingFull(id)
  return successResponse(mapMeetingDetail(full!), 'แนบเอกสารวาระสำเร็จ')
}
