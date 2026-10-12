import { NextRequest } from 'next/server'
import { writeAuditLog } from '@/app/admin/server/audit'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { calcOverallProgress } from '@/app/elearning/server/elearning'
import { prisma } from '@/app/common/server/prisma'
import { getClientIp, requireStaffPlus } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; lessonId: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaffPlus(request)
  if ('error' in auth) return auth.error

  const { id, lessonId } = await ctx.params
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId: id, isActive: true },
  })
  if (!lesson) return errorResponse(404, 'ไม่พบบทเรียน', 'LESSON_NOT_FOUND')

  const userId = auth.auth.user.id

  await prisma.userProgress.upsert({
    where: {
      userId_courseId_lessonId: { userId, courseId: id, lessonId },
    },
    update: { completed: true, completedAt: new Date() },
    create: {
      userId,
      courseId: id,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
  })

  const overallProgress = await calcOverallProgress(userId, id)

  await writeAuditLog({
    userId,
    action: 'LESSON_COMPLETE',
    entity: 'user_progress',
    entityId: lessonId,
    newData: { courseId: id, overallProgress },
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
  })

  return successResponse({ completed: true, overallProgress })
}
