import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/app/auth/server/auth-user'
import {
  documentLinkFromStorage,
  isDocumentLinkStorage,
  normalizeDocumentLink,
} from '@/app/common/document-link'
import { canAccessLevel } from '@/app/documents/server/documents-access'
import { getClientIp, logDocumentDownload } from '@/app/documents/server/documents'
import { readDocumentVersionPdf } from '@/app/documents/server/documents'
import { getOptionalAuth } from '@/app/auth/server/optional-auth'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { searchParams } = new URL(request.url)
  const versionId = searchParams.get('versionId')
  const { viewerRole, user } = await getOptionalAuth(request)

  const doc = await prisma.haDocument.findFirst({
    where: { id, isActive: true },
    include: {
      versions: {
        where: versionId ? { id: versionId } : { isCurrent: true },
        take: 1,
      },
    },
  })

  if (!doc) return errorResponse(404, 'ไม่พบเอกสาร', 'DOCUMENT_NOT_FOUND')
  if (!canAccessLevel(viewerRole, doc.accessLevel)) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึงเอกสาร', 'DOCUMENT_ACCESS_DENIED')
  }

  const version = doc.versions[0]
  if (!version) return errorResponse(404, 'ไม่พบไฟล์เอกสาร', 'DOCUMENT_FILE_MISSING')

  try {
    await logDocumentDownload({
      documentId: doc.id,
      versionId: version.id,
      userId: user?.id,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    if (isDocumentLinkStorage(version.filePath)) {
      const external = documentLinkFromStorage(version.filePath)
      const parsed = normalizeDocumentLink(external)
      const target = parsed.ok ? parsed.url : external
      return NextResponse.redirect(target, 302)
    }

    const data = await readDocumentVersionPdf(version)

    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(version.fileName)}"`,
      },
    })
  } catch {
    return errorResponse(404, 'ไม่พบไฟล์บนระบบ', 'DOCUMENT_FILE_MISSING')
  }
}
