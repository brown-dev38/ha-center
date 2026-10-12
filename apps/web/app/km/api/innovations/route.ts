import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const sessionId = searchParams.get('sessionId')

  const innovations = await prisma.kmInnovation.findMany({
    where: {
      isActive: true,
      ...(year ? { year: Number(year) } : {}),
      ...(sessionId ? { sessionId } : {}),
    },
    include: {
      session: { select: { id: true, title: true } },
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(
    innovations.map((i) => ({
      id: i.id,
      sessionId: i.sessionId,
      title: i.title,
      innovationType: i.innovationType,
      description: i.description,
      result: i.result,
      year: i.year,
      status: i.status,
      session: i.session,
      author: { id: i.author.id, name: `${i.author.firstName} ${i.author.lastName}`.trim() },
    }))
  )
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!hasPermission(auth.user.role, 'km:write')) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

  let body: {
    sessionId?: string
    title?: string
    innovationType?: string
    description?: string
    result?: string
    year?: number
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.title || !body.description) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const innovation = await prisma.kmInnovation.create({
    data: {
      sessionId: body.sessionId,
      title: body.title,
      innovationType: body.innovationType,
      description: body.description,
      result: body.result,
      year: body.year,
      authorId: auth.user.id,
    },
  })

  return successResponse(innovation, 'สร้างนวัตกรรมสำเร็จ')
}
