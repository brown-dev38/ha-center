import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { getClientIp, requireRole } from '@/app/auth/server/route-auth'
import { writeAuditLog } from '@/app/admin/server/audit'
import {
  deleteQualityDocumentUnit,
  updateQualityDocumentUnit,
} from '@/app/documents/server/quality-units-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error
    const { id } = await ctx.params
    const body = (await request.json()) as {
      order?: number
      code?: string
      name?: string
      group?: string
    }
    try {
      const updated = await updateQualityDocumentUnit(id, body, auth.auth.user.id)
      await writeAuditLog({
        userId: auth.auth.user.id,
        action: 'QUALITY_UNIT_UPDATED',
        entity: 'quality_document_unit',
        entityId: id,
        newData: updated,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      })
      return successResponse(updated, 'แก้ไขหน่วยงาน/ทีมแล้ว')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ'
      if (message.includes('ไม่พบ')) return errorResponse(404, message, 'NOT_FOUND')
      const code = message.includes('มีอยู่แล้ว') ? 'DUPLICATE_CODE' : 'VALIDATION_ERROR'
      return errorResponse(code === 'DUPLICATE_CODE' ? 409 : 422, message, code)
    }
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error
    const { id } = await ctx.params
    try {
      const removed = await deleteQualityDocumentUnit(id, auth.auth.user.id)
      await writeAuditLog({
        userId: auth.auth.user.id,
        action: 'QUALITY_UNIT_DELETED',
        entity: 'quality_document_unit',
        entityId: id,
        oldData: removed,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      })
      return successResponse({ id }, 'ลบหน่วยงาน/ทีมแล้ว')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ลบไม่สำเร็จ'
      if (message.includes('ไม่พบ')) return errorResponse(404, message, 'NOT_FOUND')
      return errorResponse(422, message, 'VALIDATION_ERROR')
    }
  })
}
