import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/app/auth/server/auth-user'
import { generateCertificatePdf } from '@/app/elearning/server/certificate-pdf'
import { formatUserName } from '@/app/elearning/server/elearning'
import { saveCertificatePdf } from '@/app/elearning/server/elearning-storage'
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
      course: { select: { title: true, passScore: true } },
    },
  })
  if (!cert) return errorResponse(404, 'ไม่พบใบรับรอง', 'CERTIFICATE_NOT_FOUND')

  let buffer: Buffer | null = null
  if (cert.filePath) {
    try {
      buffer = await readLessonOrCertificateFile(cert.filePath)
    } catch {
      buffer = null
    }
  }

  if (!buffer) {
    buffer = await generateCertificatePdf({
      certificateNo: cert.certificateNo,
      verifyCode: cert.verifyCode,
      userName: formatUserName(cert.user.firstName, cert.user.lastName),
      courseTitle: cert.course.title,
      score: cert.score ?? 0,
      issuedAt: cert.issuedAt,
    })
    const filePath = await saveCertificatePdf(cert.id, buffer)
    await prisma.certificate.update({ where: { id: cert.id }, data: { filePath } })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificate-${cert.certificateNo}.pdf"`,
    },
  })
}
