import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { formatUserName } from '@/app/elearning/server/elearning'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ certificateId: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { certificateId } = await ctx.params
  const cert = await prisma.certificate.findFirst({
    where: {
      OR: [{ id: certificateId }, { verifyCode: certificateId }],
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      course: { select: { title: true } },
    },
  })
  if (!cert) return errorResponse(404, 'ไม่พบใบรับรอง', 'CERTIFICATE_NOT_FOUND')

  return successResponse({
    valid: cert.passed,
    certificateData: {
      certificateNo: cert.certificateNo,
      userName: formatUserName(cert.user.firstName, cert.user.lastName),
      courseTitle: cert.course.title,
      score: cert.score,
      issuedAt: cert.issuedAt.toISOString(),
    },
  })
}
