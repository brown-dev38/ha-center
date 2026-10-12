import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { isAdminRole } from '@/app/common/server/permissions'
import { parseRelatedLinkInput } from '@/app/links/server/related-links'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const links = await prisma.relatedLink.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(links)
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!isAdminRole(auth.user.role)) {
      return errorResponse(403, 'เฉพาะผู้ดูแลระบบ', 'AUTH_FORBIDDEN')
    }

    const body = await request.json().catch(() => null)
    const parsed = parseRelatedLinkInput(body)
    if (!parsed.ok) return errorResponse(422, parsed.error, 'VALIDATION_ERROR')

    const link = await prisma.relatedLink.create({ data: parsed.data })
    return successResponse(link, 'เพิ่มลิงก์สำเร็จ')
  })
}
