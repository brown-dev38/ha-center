import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import type { HaV6DocStatus, HaV6StorageItem } from '@/app/documents/ha-v6-tracker-types'
import {
  bulkUpsertHaV6DocumentStates,
  canReadHaV6Tracker,
  canWriteHaV6Tracker,
  listHaV6DocumentStates,
  upsertHaV6DocumentState,
} from '@/app/documents/server/ha-v6-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canReadHaV6Tracker(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์ดูเอกสาร HA v6', 'FORBIDDEN')
    }

    const states = await listHaV6DocumentStates()
    return successResponse(states)
  })
}

export async function PATCH(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canWriteHaV6Tracker(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์แก้ไขเอกสาร HA v6', 'FORBIDDEN')
    }

    const body = (await request.json()) as {
      documentId?: string
      status?: HaV6DocStatus
      progressPercent?: number
      storageItems?: HaV6StorageItem[]
      remarks?: string
      /** migrate หลายรายการจาก localStorage ครั้งเดียว */
      states?: Array<{
        documentId: string
        status?: HaV6DocStatus
        progressPercent?: number
        storageItems?: HaV6StorageItem[]
        remarks?: string
      }>
      migrate?: boolean
    }

    if (body.migrate && Array.isArray(body.states)) {
      const existing = await listHaV6DocumentStates()
      if (Object.keys(existing).length > 0) {
        return successResponse(existing, 'มีข้อมูลบนเซิร์ฟเวอร์แล้ว ไม่ต้อง migrate')
      }
      const migrated = await bulkUpsertHaV6DocumentStates(auth.user, body.states)
      return successResponse(migrated, 'นำเข้าข้อมูลจากเครื่องเรียบร้อย')
    }

    if (!body.documentId?.trim()) {
      return errorResponse(422, 'ต้องระบุ documentId', 'VALIDATION_ERROR')
    }

    try {
      const state = await upsertHaV6DocumentState(auth.user, body.documentId, {
        status: body.status,
        progressPercent: body.progressPercent,
        storageItems: body.storageItems,
        remarks: body.remarks,
      })
      return successResponse(state, 'บันทึกสถานะเอกสารเรียบร้อย')
    } catch (err) {
      if (err instanceof Error && err.message === 'VALIDATION_ERROR') {
        return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
      }
      if (err instanceof Error && err.message === 'ADMIN_REQUIRED') {
        return errorResponse(403, 'ลบหรือซ่อนไฟล์ได้เฉพาะผู้ดูแลระบบ', 'FORBIDDEN')
      }
      throw err
    }
  })
}
