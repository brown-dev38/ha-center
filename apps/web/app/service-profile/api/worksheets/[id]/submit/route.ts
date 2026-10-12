import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  canWriteWorksheets,
  mapWorksheetResponse,
  submitWorksheet,
} from '@/app/service-profile/server/worksheets'
import type { UnitProfileWorksheet } from '@/app/service-profile/worksheet-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canWriteWorksheets(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์ส่งเอกสาร', 'FORBIDDEN')
    }

    const { id } = await ctx.params
    const body = (await request.json()) as { formData?: UnitProfileWorksheet }
    if (!body.formData) {
      return errorResponse(400, 'ข้อมูลฟอร์มไม่ครบ', 'VALIDATION_ERROR')
    }

    try {
      const { worksheet, version } = await submitWorksheet(auth.user, id, body.formData)
      return successResponse(
        {
          ...mapWorksheetResponse(worksheet),
          version: {
            id: version.id,
            versionNo: version.versionNo,
            generatedAt: version.generatedAt.toISOString(),
          },
        },
        'ส่งเอกสารแล้ว'
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        return errorResponse(403, 'ไม่สามารถส่งเอกสารนี้ได้', 'FORBIDDEN')
      }
      throw err
    }
  })
}
