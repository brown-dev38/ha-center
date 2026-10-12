import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { canTakeQuiz, mapQuestionPublic } from '@/app/elearning/server/elearning'
import { prisma } from '@/app/common/server/prisma'
import { requireStaffPlus } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaffPlus(request)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const ready = await canTakeQuiz(auth.auth.user.id, id)
  if (!ready) {
    return errorResponse(403, 'ต้องเรียนครบทุกบทก่อนทำแบบทดสอบ', 'QUIZ_NOT_READY')
  }

  const quiz = await prisma.quiz.findUnique({
    where: { courseId: id },
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!quiz) return errorResponse(404, 'ไม่พบแบบทดสอบ', 'QUIZ_NOT_FOUND')

  return successResponse({
    id: quiz.id,
    title: quiz.title,
    passScore: quiz.passScore,
    questions: quiz.questions.map(mapQuestionPublic),
  })
}
