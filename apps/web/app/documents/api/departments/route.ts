import { NextRequest } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { listQualityDocumentUnits } from '@/app/documents/server/quality-units-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'documents:read')) {
      return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
    }

    const units = await listQualityDocumentUnits()
    return successResponse(
      units.map((unit) => ({
        id: unit.id,
        code: unit.code,
        name: unit.name,
        group: unit.group,
      }))
    )
  })
}
