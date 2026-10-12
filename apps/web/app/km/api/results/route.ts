import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const sessionId = searchParams.get('sessionId')
  const year = searchParams.get('year')

  const results = await prisma.kmResult.findMany({
    where: {
      isActive: true,
      ...(type ? { type } : {}),
      ...(sessionId ? { sessionId } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    include: {
      session: { select: { id: true, title: true, fiscalYear: true } },
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(
    results.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      type: r.type,
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl,
      systemUrl: r.systemUrl,
      year: r.year ?? r.session.fiscalYear,
      session: r.session,
      author: { id: r.author.id, name: `${r.author.firstName} ${r.author.lastName}`.trim() },
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
    type?: 'system' | 'innovation'
    title?: string
    description?: string
    imageUrl?: string
    systemUrl?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.sessionId || !body.type || !body.title) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const result = await prisma.kmResult.create({
    data: {
      sessionId: body.sessionId,
      type: body.type,
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      systemUrl: body.systemUrl,
      authorId: auth.user.id,
    },
  })

  return successResponse(result, 'สร้างผลลัพธ์ KM สำเร็จ')
}
