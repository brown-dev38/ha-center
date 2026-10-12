import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import {
  calcOverallProgress,
  canTakeQuiz,
  getCompletedLessonIds,
} from '@/app/elearning/server/elearning'
import { prisma } from '@/app/common/server/prisma'
import { requireStaffPlus } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaffPlus(request)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const course = await prisma.course.findFirst({ where: { id, isActive: true } })
  if (!course) return errorResponse(404, 'ไม่พบหลักสูตร', 'COURSE_NOT_FOUND')

  const userId = auth.auth.user.id
  const completedLessons = await getCompletedLessonIds(userId, id)
  const overallProgress = await calcOverallProgress(userId, id)
  const canQuiz = await canTakeQuiz(userId, id)

  return successResponse({
    completedLessons,
    overallProgress,
    canTakeQuiz: canQuiz,
  })
}
