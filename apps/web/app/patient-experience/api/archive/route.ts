import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { hasPermission } from '@/app/common/server/permissions'
import {
  readPeSurveyArchive,
  writePeSurveyArchive,
} from '@/app/patient-experience/server/pe-archive-store'
import {
  normalizePeYearArchive,
  type PeYearArchive,
} from '@/app/patient-experience/pe-year-archive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function canUsePeArchive(role: string): boolean {
  return hasPermission(role, 'indicators:read')
}

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canUsePeArchive(auth.user.role)) {
      return errorResponse(403, 'ไม่มีสิทธิ์ดูข้อมูล PEP', 'FORBIDDEN')
    }

    const snapshot = await readPeSurveyArchive()
    return successResponse(snapshot)
  })
}

export async function PUT(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canUsePeArchive(auth.user.role)) {
      return errorResponse(403, 'ไม่มีสิทธิ์บันทึกข้อมูล PEP', 'FORBIDDEN')
    }

    const body = (await request.json()) as {
      archive?: PeYearArchive
      expectedRevision?: number
    }
    if (!body.archive || typeof body.archive !== 'object' || Array.isArray(body.archive)) {
      return errorResponse(422, 'ข้อมูลคลังไม่ถูกต้อง', 'VALIDATION_ERROR')
    }
    const expectedRevision = Number(body.expectedRevision)
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
      return errorResponse(422, 'ต้องระบุรุ่นข้อมูลที่กำลังแก้', 'VALIDATION_ERROR')
    }

    try {
      const result = await writePeSurveyArchive(
        normalizePeYearArchive(body.archive),
        expectedRevision,
        auth.user.id
      )
      if (result.conflict) {
        return NextResponse.json(
          {
            success: false,
            error: 'มีเครื่องอื่นบันทึกข้อมูลชุดนี้ไปแล้ว',
            code: 'CONFLICT',
            data: result.snapshot,
          },
          { status: 409, headers: { 'Cache-Control': 'no-store' } }
        )
      }
      return successResponse(result.snapshot, 'บันทึกคลัง PEP แล้ว')
    } catch (error) {
      if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
        return errorResponse(413, 'ไฟล์ใหญ่เกินกว่าจะเก็บร่วมกันได้', 'PAYLOAD_TOO_LARGE')
      }
      throw error
    }
  })
}
