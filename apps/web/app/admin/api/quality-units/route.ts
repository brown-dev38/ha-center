import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { getClientIp, requireRole } from '@/app/auth/server/route-auth'
import { writeAuditLog } from '@/app/admin/server/audit'
import {
  createQualityDocumentUnit,
  listQualityDocumentUnits,
} from '@/app/documents/server/quality-units-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error
    return successResponse(await listQualityDocumentUnits())
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const body = (await request.json()) as {
      order?: number
      code?: string
      name?: string
      group?: string
    }
    try {
      const created = await createQualityDocumentUnit(
        {
          order: body.order,
          code: body.code ?? '',
          name: body.name ?? '',
          group: body.group ?? '',
        },
        auth.auth.user.id
      )
      await writeAuditLog({
        userId: auth.auth.user.id,
        action: 'QUALITY_UNIT_CREATED',
        entity: 'quality_document_unit',
        entityId: created.id,
        newData: created,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      })
      return successResponse(created, 'เพิ่มหน่วยงาน/ทีมแล้ว')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ'
      const code = message.includes('มีอยู่แล้ว') ? 'DUPLICATE_CODE' : 'VALIDATION_ERROR'
      return errorResponse(code === 'DUPLICATE_CODE' ? 409 : 422, message, code)
    }
  })
}
