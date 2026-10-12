import { NextRequest } from 'next/server'
import { mapCqiListItem, parseCqiInput } from '@/app/cqi/server/cqi'
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

  const where = {
    isActive: true,
    ...(searchParams.get('departmentId') ? { departmentId: searchParams.get('departmentId')! } : {}),
    ...(searchParams.get('year') ? { year: Number(searchParams.get('year')) } : {}),
    ...(searchParams.get('status') ? { status: searchParams.get('status')! } : {}),
    ...(searchParams.get('isOutstanding') === 'true' ? { isOutstanding: true } : {}),
    ...(searchParams.get('search')
      ? {
          OR: [
            { title: { contains: searchParams.get('search')! } },
            { description: { contains: searchParams.get('search')! } },
          ],
        }
      : {}),
  }

  const [total, projects] = await Promise.all([
    prisma.cqiProject.count({ where }),
    prisma.cqiProject.findMany({
      where,
      include: {
        department: true,
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return Response.json({
    success: true,
    data: projects.map(mapCqiListItem),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'cqi:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์เพิ่มโครงการ CQI', 'AUTH_FORBIDDEN')
    }

    const body = await request.json().catch(() => null)
    const parsed = parseCqiInput(body)
    if (!parsed.ok) return errorResponse(422, parsed.error, 'VALIDATION_ERROR')

    const project = await prisma.cqiProject.create({
      data: {
        ...parsed.data,
        leadId: auth.user.id,
      },
    })

    return successResponse({ id: project.id }, 'สร้างโครงการ CQI สำเร็จ')
  })
}
