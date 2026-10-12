import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { isAdminRole } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function str(v: unknown, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!isAdminRole(auth.user.role)) {
      return errorResponse(403, 'เฉพาะผู้ดูแลระบบ', 'AUTH_FORBIDDEN')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const requests = await prisma.consultRequest.findMany({
      where: status ? { status } : {},
      orderBy: [{ urgent: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    })

    const counts = await prisma.consultRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const summary = counts.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = c._count._all
      return acc
    }, {})

    return successResponse({ requests, summary })
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
    }
    const b = body as Record<string, unknown>

    const topic = str(b.topic, 120)
    const department = str(b.department, 160)
    const name = str(b.name, 160)
    const email = str(b.email, 200)
    const message = str(b.message, 4000)

    if (!topic) return errorResponse(422, 'กรุณาเลือกหัวข้อ', 'VALIDATION_ERROR')
    if (!department) return errorResponse(422, 'กรุณาระบุหน่วยงาน', 'VALIDATION_ERROR')
    if (!name) return errorResponse(422, 'กรุณาระบุชื่อผู้ติดต่อ', 'VALIDATION_ERROR')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(422, 'รูปแบบอีเมลไม่ถูกต้อง', 'VALIDATION_ERROR')
    }
    if (message.length < 10) {
      return errorResponse(422, 'รายละเอียดอย่างน้อย 10 ตัวอักษร', 'VALIDATION_ERROR')
    }

    const created = await prisma.consultRequest.create({
      data: {
        topic,
        department,
        name,
        email,
        phone: str(b.phone, 40) || null,
        urgent: Boolean(b.urgent),
        message,
      },
    })

    return successResponse({ id: created.id }, 'ส่งคำขอปรึกษาสำเร็จ ทีมงานจะติดต่อกลับภายใน 1–2 วันทำการ')
  })
}
