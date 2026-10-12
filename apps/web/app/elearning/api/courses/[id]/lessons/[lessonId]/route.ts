import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; lessonId: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id, lessonId } = await ctx.params
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId: id, isActive: true },
  })
  if (!lesson) return errorResponse(404, 'ไม่พบบทเรียน', 'LESSON_NOT_FOUND')

  return successResponse({
    id: lesson.id,
    title: lesson.title,
    orderNo: lesson.orderNo,
    contentType: lesson.contentType,
    content: lesson.content,
    contentUrl: lesson.contentUrl ?? lesson.videoUrl,
    videoUrl: lesson.videoUrl,
    filePath: lesson.filePath
      ? `/api/v1/elearning/courses/${id}/lessons/${lessonId}/file`
      : null,
    duration: lesson.duration,
  })
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id, lessonId } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'elearning:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์จัดการบทเรียน', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId: id, isActive: true },
    })
    if (!existing) return errorResponse(404, 'ไม่พบบทเรียน', 'LESSON_NOT_FOUND')

    const body = await request.json().catch(() => null)
    const b = (body ?? {}) as Record<string, unknown>
    const data: Record<string, unknown> = {}
    if (typeof b.title === 'string') {
      const t = b.title.trim()
      if (!t) return errorResponse(422, 'ชื่อบทเรียนห้ามว่าง', 'VALIDATION_ERROR')
      data.title = t
    }
    if ('content' in b) data.content = typeof b.content === 'string' ? b.content : null
    if (typeof b.contentType === 'string') data.contentType = b.contentType
    if ('contentUrl' in b)
      data.contentUrl = typeof b.contentUrl === 'string' ? b.contentUrl.trim() || null : null
    if ('videoUrl' in b)
      data.videoUrl = typeof b.videoUrl === 'string' ? b.videoUrl.trim() || null : null
    if ('duration' in b)
      data.duration = Number.isFinite(Number(b.duration)) ? Number(b.duration) : null
    if (Number.isFinite(Number(b.orderNo))) {
      data.orderNo = Number(b.orderNo)
      data.sortOrder = Number(b.orderNo)
    }

    await prisma.lesson.update({ where: { id: lessonId }, data })
    return successResponse({ id: lessonId }, 'บันทึกบทเรียนสำเร็จ')
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id, lessonId } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'elearning:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์จัดการบทเรียน', 'AUTH_FORBIDDEN')
    }

    const existing = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId: id, isActive: true },
    })
    if (!existing) return errorResponse(404, 'ไม่พบบทเรียน', 'LESSON_NOT_FOUND')

    await prisma.lesson.update({ where: { id: lessonId }, data: { isActive: false } })
    return successResponse({ id: lessonId }, 'ลบบทเรียนสำเร็จ')
  })
}
