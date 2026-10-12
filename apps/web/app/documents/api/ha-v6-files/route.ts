import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  canWriteHaV6Tracker,
  saveHaV6TrackerFile,
} from '@/app/documents/server/ha-v6-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canWriteHaV6Tracker(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์อัปโหลดไฟล์ HA v6', 'FORBIDDEN')
    }

    const form = await request.formData()
    const documentId = String(form.get('documentId') ?? '').trim()
    const file = form.get('file')

    if (!documentId) {
      return errorResponse(422, 'ต้องระบุ documentId', 'VALIDATION_ERROR')
    }
    if (!(file instanceof File)) {
      return errorResponse(422, 'ไม่พบไฟล์', 'VALIDATION_ERROR')
    }

    try {
      const item = await saveHaV6TrackerFile({
        user: auth.user,
        documentId,
        file,
      })
      return successResponse(item, 'อัปโหลดไฟล์เรียบร้อย')
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'DOCUMENT_FILE_TOO_LARGE') {
          return errorResponse(422, 'ขนาดไฟล์ต้องไม่เกิน 50MB', 'DOCUMENT_FILE_TOO_LARGE')
        }
        if (err.message === 'DOCUMENT_INVALID_FILE' || err.message === 'VALIDATION_ERROR') {
          return errorResponse(422, 'ไฟล์ไม่ถูกต้อง', 'DOCUMENT_INVALID_FILE')
        }
      }
      throw err
    }
  })
}
