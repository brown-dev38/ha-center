import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  canAdminHaV6Storage,
  canReadHaV6Tracker,
  deleteHaV6TrackerFile,
  getHaV6TrackerFile,
  readHaV6TrackerFileBuffer,
} from '@/app/documents/server/ha-v6-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ fileId: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canReadHaV6Tracker(auth.user)) {
      return errorResponse(403, 'ไม่มีสิทธิ์ดูไฟล์', 'FORBIDDEN')
    }

    const { fileId } = await ctx.params
    const file = await getHaV6TrackerFile(fileId)
    if (!file) return errorResponse(404, 'ไม่พบไฟล์', 'NOT_FOUND')

    const buffer = await readHaV6TrackerFileBuffer(file)
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'UNAUTHORIZED')
    if (!canAdminHaV6Storage(auth.user)) {
      return errorResponse(403, 'ลบไฟล์ได้เฉพาะผู้ดูแลระบบ', 'FORBIDDEN')
    }

    const { fileId } = await ctx.params
    await deleteHaV6TrackerFile(fileId)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}
