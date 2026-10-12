import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  canReadWorksheets,
  canWriteWorksheets,
  getWorksheetById,
  mapWorksheetResponse,
  setWorksheetHidden,
  updateWorksheet,
} from '@/app/service-profile/server/worksheets'
import type { UnitProfileWorksheet } from '@/app/service-profile/worksheet-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canReadWorksheets(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึงเอกสาร', 'FORBIDDEN')
    }

    const { id } = await ctx.params
    const row = await getWorksheetById(auth.user, id)
    if (!row) return errorResponse(404, 'ไม่พบเอกสาร', 'NOT_FOUND')

    return successResponse({
      ...mapWorksheetResponse(row, auth.user),
      versions: row.versions.map((v) => ({
        id: v.id,
        versionNo: v.versionNo,
        pdfPath: v.pdfPath,
        docPath: v.docPath,
        generatedAt: v.generatedAt.toISOString(),
      })),
    })
  })
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canWriteWorksheets(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์แก้ไขเอกสาร', 'FORBIDDEN')
    }

    const { id } = await ctx.params
    const body = (await request.json()) as { formData?: UnitProfileWorksheet }
    if (!body.formData) {
      return errorResponse(400, 'ข้อมูลฟอร์มไม่ครบ', 'VALIDATION_ERROR')
    }

    try {
      const row = await updateWorksheet(auth.user, id, body.formData)
      return successResponse(mapWorksheetResponse(row), 'บันทึกแบบร่างแล้ว')
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        return errorResponse(403, 'ไม่สามารถแก้ไขเอกสารนี้ได้', 'FORBIDDEN')
      }
      throw err
    }
  })
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')

    const { id } = await ctx.params
    let body: { hidden?: boolean }
    try {
      body = (await request.json()) as { hidden?: boolean }
    } catch {
      return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
    }
    if (typeof body.hidden !== 'boolean') {
      return errorResponse(400, 'กรุณาระบุ hidden: true/false', 'VALIDATION_ERROR')
    }

    try {
      const row = await setWorksheetHidden(auth.user, id, body.hidden)
      return successResponse(
        mapWorksheetResponse(row, auth.user),
        body.hidden ? 'ซ่อนเอกสารแล้ว' : 'แสดงเอกสารอีกครั้งแล้ว'
      )
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        return errorResponse(403, 'เฉพาะผู้ดูแลระบบเท่านั้น', 'FORBIDDEN')
      }
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        return errorResponse(404, 'ไม่พบเอกสาร', 'NOT_FOUND')
      }
      throw err
    }
  })
}
