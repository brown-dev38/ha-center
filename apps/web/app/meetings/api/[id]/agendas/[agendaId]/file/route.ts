import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/app/auth/server/auth-user'
import { readStoredPdf } from '@/app/meetings/server/meeting-storage'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; agendaId: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id, agendaId } = await ctx.params
  const agenda = await prisma.meetingAgenda.findFirst({ where: { id: agendaId, meetingId: id } })
  if (!agenda?.attachmentPath) {
    return errorResponse(404, 'ไม่พบไฟล์วาระ', 'AGENDA_FILE_NOT_FOUND')
  }

  const redirect = redirectIfExternalLink(agenda.attachmentPath)
  if (redirect) return redirect

  try {
    const data = await readStoredPdf(agenda.attachmentPath)
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(agenda.attachmentFileName ?? 'agenda.pdf')}"`,
      },
    })
  } catch {
    return errorResponse(404, 'ไม่พบไฟล์บนระบบ', 'AGENDA_FILE_NOT_FOUND')
  }
}
