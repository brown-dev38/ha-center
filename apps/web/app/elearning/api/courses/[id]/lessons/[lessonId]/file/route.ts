import { basename } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; lessonId: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id, lessonId } = await ctx.params
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId: id, isActive: true },
  })
  if (!lesson?.filePath) {
    return errorResponse(404, 'ไม่พบบทเรียน', 'LESSON_NOT_FOUND')
  }

  try {
    const buffer = await readLessonOrCertificateFile(lesson.filePath)
    const name = lesson.fileName ?? basename(lesson.filePath)
    const ext = name.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'pdf'
        ? 'application/pdf'
        : ext === 'mp4'
          ? 'video/mp4'
          : 'application/octet-stream'

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${name}"`,
      },
    })
  } catch {
    return errorResponse(404, 'ไม่พบไฟล์', 'LESSON_FILE_NOT_FOUND')
  }
}
