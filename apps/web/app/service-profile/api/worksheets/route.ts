import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  canReadWorksheets,
  canWriteWorksheets,
  createWorksheet,
  listWorksheets,
  mapWorksheetResponse,
} from '@/app/service-profile/server/worksheets'
import type { UnitProfileWorksheet } from '@/app/service-profile/worksheet-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canReadWorksheets(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึงเอกสาร Service Profile', 'FORBIDDEN')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const yearRaw = searchParams.get('year')
    const year = yearRaw ? Number(yearRaw) : undefined
    const departmentId = searchParams.get('departmentId') ?? undefined
    const includeHidden = searchParams.get('includeHidden') === 'true'

    const data = await listWorksheets(auth.user, { status, year, departmentId, includeHidden })
    return successResponse(data)
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canWriteWorksheets(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์สร้างเอกสาร', 'FORBIDDEN')
    }

    const body = (await request.json()) as {
      formData?: UnitProfileWorksheet
      departmentId?: string
    }

    if (!body.formData) {
      return errorResponse(400, 'ข้อมูลฟอร์มไม่ครบ', 'VALIDATION_ERROR')
    }

    try {
      const row = await createWorksheet(auth.user, body.formData, body.departmentId)
      return successResponse(mapWorksheetResponse(row), 'บันทึกแบบร่างแล้ว')
    } catch (err) {
      if (err instanceof Error && err.message === 'DEPARTMENT_REQUIRED') {
        return errorResponse(400, 'ต้องระบุหน่วยงานก่อนบันทึก', 'DEPARTMENT_REQUIRED')
      }
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        return errorResponse(403, 'ไม่มีสิทธิ์บันทึกเอกสารหน่วยงานนี้', 'FORBIDDEN')
      }
      throw err
    }
  })
}
