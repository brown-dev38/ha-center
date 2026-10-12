import { NextRequest } from 'next/server'
import { writeAuditLog } from '@/app/admin/server/audit'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import {
  canTakeQuiz,
  formatUserName,
  issueCertificate,
} from '@/app/elearning/server/elearning'
import { prisma } from '@/app/common/server/prisma'
import { getClientIp, requireStaffPlus } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }
type Body = {
  answers: Array<{ questionId: string; selectedOption: 'A' | 'B' | 'C' | 'D' }>
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const auth = await requireStaffPlus(request)
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const userId = auth.auth.user.id

  const ready = await canTakeQuiz(userId, id)
  if (!ready) {
    return errorResponse(403, 'ต้องเรียนครบทุกบทก่อนทำแบบทดสอบ', 'QUIZ_NOT_READY')
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const course = await prisma.course.findFirst({
    where: { id, isActive: true },
    include: { quiz: { include: { questions: true } } },
  })
  if (!course?.quiz) return errorResponse(404, 'ไม่พบแบบทดสอบ', 'QUIZ_NOT_FOUND')

  const questions = course.quiz.questions
  let correct = 0
  const correctAnswers = questions.map((q) => {
    const selected = body.answers.find((a) => a.questionId === q.id)?.selectedOption
    const isCorrect = selected === q.correctOption
    if (isCorrect) correct++
    return {
      questionId: q.id,
      correctOption: q.correctOption,
      explanation: q.explanation,
    }
  })

  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const passScore = course.passScore
  const passed = score >= passScore

  const existingProgress = await prisma.userProgress.findFirst({
    where: { userId, courseId: id, lessonId: null },
  })
  if (existingProgress) {
    await prisma.userProgress.update({
      where: { id: existingProgress.id },
      data: { score, completed: passed, completedAt: new Date() },
    })
  } else {
    await prisma.userProgress.create({
      data: {
        userId,
        courseId: id,
        lessonId: null,
        score,
        completed: passed,
        completedAt: new Date(),
      },
    })
  }

  let certificate: { id: string; url: string; certificateNo: string } | undefined
  if (passed) {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } })
    if (dbUser) {
      certificate = await issueCertificate({
        userId,
        courseId: id,
        courseTitle: course.title,
        userName: formatUserName(dbUser.firstName, dbUser.lastName),
        score,
        passScore,
      })
    }
  }

  await writeAuditLog({
    userId,
    action: 'QUIZ_SUBMIT',
    entity: 'quiz',
    entityId: course.quiz.id,
    newData: { score, passed },
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
  })

  return successResponse({
    score,
    passed,
    correctAnswers,
    ...(certificate ? { certificate } : {}),
  })
}
