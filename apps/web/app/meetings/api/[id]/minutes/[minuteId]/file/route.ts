import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/app/auth/server/auth-user'
import { readStoredPdf } from '@/app/meetings/server/meeting-storage'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; minuteId: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id, minuteId } = await ctx.params
  const minute = await prisma.meetingMinute.findFirst({ where: { id: minuteId, meetingId: id } })
  if (!minute?.filePath) {
    return errorResponse(404, 'ไม่พบไฟล์รายงานการประชุม', 'MEETING_FILE_NOT_FOUND')
  }

  try {
    const data = await readStoredPdf(minute.filePath)
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(minute.fileName ?? 'minutes.pdf')}"`,
      },
    })
  } catch {
    return errorResponse(404, 'ไม่พบไฟล์บนระบบ', 'MEETING_FILE_NOT_FOUND')
  }
}
