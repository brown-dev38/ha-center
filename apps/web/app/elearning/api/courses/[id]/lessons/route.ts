import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const { id } = await ctx.params
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'elearning:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์จัดการบทเรียน', 'AUTH_FORBIDDEN')
    }

    const course = await prisma.course.findFirst({ where: { id, isActive: true } })
    if (!course) return errorResponse(404, 'ไม่พบหลักสูตร', 'COURSE_NOT_FOUND')

    const body = await request.json().catch(() => null)
    const b = (body ?? {}) as Record<string, unknown>
    const title = typeof b.title === 'string' ? b.title.trim() : ''
    if (!title) return errorResponse(422, 'กรุณาระบุชื่อบทเรียน', 'VALIDATION_ERROR')

    const last = await prisma.lesson.findFirst({
      where: { courseId: id, isActive: true },
      orderBy: { orderNo: 'desc' },
      select: { orderNo: true },
    })
    const orderNo = (last?.orderNo ?? 0) + 1

    const lesson = await prisma.lesson.create({
      data: {
        courseId: id,
        title,
        content: typeof b.content === 'string' ? b.content : null,
        contentType: typeof b.contentType === 'string' ? b.contentType : 'text',
        contentUrl: typeof b.contentUrl === 'string' ? b.contentUrl.trim() || null : null,
        videoUrl: typeof b.videoUrl === 'string' ? b.videoUrl.trim() || null : null,
        duration: Number.isFinite(Number(b.duration)) ? Number(b.duration) : null,
        orderNo,
        sortOrder: orderNo,
      },
    })

    return successResponse({ id: lesson.id }, 'เพิ่มบทเรียนสำเร็จ')
  })
}
