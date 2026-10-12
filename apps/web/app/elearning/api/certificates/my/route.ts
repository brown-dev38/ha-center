import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'
import { requireStaffPlus } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireStaffPlus(request)
  if ('error' in auth) return auth.error

  const certs = await prisma.certificate.findMany({
    where: { userId: auth.auth.user.id },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { issuedAt: 'desc' },
  })

  return successResponse(
    certs.map((c) => ({
      id: c.id,
      certificateNo: c.certificateNo,
      verifyCode: c.verifyCode,
      score: c.score,
      passed: c.passed,
      course: c.course,
      issuedAt: c.issuedAt.toISOString(),
      downloadUrl: `/api/v1/elearning/certificates/${c.id}/download`,
      verifyUrl: `/api/v1/elearning/certificates/${c.id}/verify`,
    }))
  )
}
