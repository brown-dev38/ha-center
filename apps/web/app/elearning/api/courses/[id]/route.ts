import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const course = await prisma.course.findFirst({
    where: { id, isActive: true },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { orderNo: 'asc' },
        select: {
          id: true,
          title: true,
          orderNo: true,
          contentType: true,
          duration: true,
        },
      },
      quiz: { include: { _count: { select: { questions: true } } } },
    },
  })

  if (!course) return errorResponse(404, 'ไม่พบหลักสูตร', 'COURSE_NOT_FOUND')

  return successResponse({
    id: course.id,
    title: course.title,
    description: course.description,
    passScore: course.passScore,
    durationHours: course.durationHours,
    isPublished: course.isPublished,
    lessons: course.lessons,
    quiz: course.quiz
      ? {
          id: course.quiz.id,
          title: course.quiz.title,
          questionCount: course.quiz._count.questions,
          passScore: course.quiz.passScore,
        }
      : null,
  })
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'elearning:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์จัดการหลักสูตร', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.course.findFirst({ where: { id, isActive: true } })
    if (!existing) return errorResponse(404, 'ไม่พบหลักสูตร', 'COURSE_NOT_FOUND')

    const body = await request.json().catch(() => null)
    const b = (body ?? {}) as Record<string, unknown>

    const data: Record<string, unknown> = {}
    if (typeof b.title === 'string') {
      const t = b.title.trim()
      if (!t) return errorResponse(422, 'ชื่อหลักสูตรห้ามว่าง', 'VALIDATION_ERROR')
      data.title = t
    }
    if (typeof b.description === 'string') data.description = b.description.trim() || null
    if (b.passScore != null && Number.isFinite(Number(b.passScore))) data.passScore = Number(b.passScore)
    if ('durationHours' in b)
      data.durationHours = b.durationHours === '' || b.durationHours == null ? null : Number(b.durationHours)
    if (typeof b.isPublished === 'boolean') data.isPublished = b.isPublished

    await prisma.course.update({ where: { id }, data })
    return successResponse({ id }, 'บันทึกหลักสูตรสำเร็จ')
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'elearning:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์จัดการหลักสูตร', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.course.findFirst({ where: { id, isActive: true } })
    if (!existing) return errorResponse(404, 'ไม่พบหลักสูตร', 'COURSE_NOT_FOUND')

    await prisma.course.update({ where: { id }, data: { isActive: false } })
    return successResponse({ id }, 'ลบหลักสูตรสำเร็จ')
  })
}
