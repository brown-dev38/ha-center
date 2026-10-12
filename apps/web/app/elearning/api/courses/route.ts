import { NextRequest } from 'next/server'
import { calcOverallProgress, getLessonCount } from '@/app/elearning/server/elearning'
import { getOptionalAuth } from '@/app/auth/server/optional-auth'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const skip = (page - 1) * limit
  const { user } = await getOptionalAuth(request)

  const where = {
    isActive: true,
    ...(searchParams.get('isPublished') === 'true' ? { isPublished: true } : {}),
    ...(searchParams.get('isPublished') === 'false' ? { isPublished: false } : {}),
    ...(searchParams.get('search')
      ? {
          OR: [
            { title: { contains: searchParams.get('search')! } },
            { description: { contains: searchParams.get('search')! } },
          ],
        }
      : {}),
  }

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({ where, orderBy: { sortOrder: 'asc' }, skip, take: limit }),
  ])

  const data = await Promise.all(
    courses.map(async (c) => {
      const lessonCount = await getLessonCount(c.id)
      let userProgress: number | null = null
      if (user) userProgress = await calcOverallProgress(user.id, c.id)
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        passScore: c.passScore,
        durationHours: c.durationHours,
        isPublished: c.isPublished,
        lessonCount,
        userProgress,
      }
    })
  )

  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'elearning:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์จัดการหลักสูตร', 'AUTH_FORBIDDEN')
    }

    const body = await request.json().catch(() => null)
    const b = (body ?? {}) as Record<string, unknown>
    const title = typeof b.title === 'string' ? b.title.trim() : ''
    if (!title) return errorResponse(422, 'กรุณาระบุชื่อหลักสูตร', 'VALIDATION_ERROR')

    const last = await prisma.course.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const course = await prisma.course.create({
      data: {
        title,
        description: typeof b.description === 'string' ? b.description.trim() || null : null,
        passScore: Number.isFinite(Number(b.passScore)) ? Number(b.passScore) : 70,
        durationHours:
          b.durationHours === '' || b.durationHours == null ? null : Number(b.durationHours),
        isPublished: Boolean(b.isPublished),
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    })

    return successResponse({ id: course.id }, 'สร้างหลักสูตรสำเร็จ')
  })
}
