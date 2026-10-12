import { NextRequest, NextResponse } from 'next/server'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser } from '@/app/auth/server/auth-user'
import { readKmSessionPdf } from '@/app/km/server/km'
import { prisma } from '@/app/common/server/prisma'

type Ctx = { params: Promise<{ id: string }> }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, ctx: Ctx) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

    const { id } = await ctx.params
    const session = await prisma.kmSession.findFirst({ where: { id, isActive: true } })

    if (!session?.fileName) {
      return errorResponse(404, 'ไม่พบไฟล์รายงาน', 'KM_REPORT_NOT_FOUND')
    }

    const redirect = redirectIfExternalLink(session.filePath)
    if (redirect) return redirect

    try {
      const data = await readKmSessionPdf(session)
      return new NextResponse(new Uint8Array(data), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(session.fileName ?? 'km-report.pdf')}"`,
        },
      })
    } catch {
      return errorResponse(404, 'ไฟล์รายงานไม่พบในระบบ', 'KM_REPORT_NOT_FOUND')
    }
  })
}
