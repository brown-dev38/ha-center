import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isFileLinkMode } from '@/app/auth/server/file-link-mode'
import { saveExternalFileLink } from '@/app/auth/server/save-external-link'
import { readStoredBinary, saveToConfiguredStorage } from '@/app/auth/server/stored-file'
import { resolveStoredLinkFields } from '@/app/common/document-link'
import { resolveUploadRoot, useGoogleDriveForFiles } from '@/app/common/server/deployment'
import { prisma } from '@/app/common/server/prisma'
import { fileToBuffer } from '@/app/documents/server/document-storage'

export const PDF_MIME = 'application/pdf'
export const MAX_PDF_SIZE = 20 * 1024 * 1024
export const KM_DB_INLINE_PATH = 'db:inline'

export function mapKmSession(session: {
  id: string
  title: string
  description: string | null
  sessionDate: Date
  fiscalYear: number | null
  status: string
  fileName: string | null
  filePath?: string | null
  fileData?: Buffer | Uint8Array | null
  department: { id: string; name: string } | null
  presenter: { id: string; firstName: string; lastName: string }
  _count?: { results: number }
}) {
  const hasFileData = Boolean(session.fileData && session.fileData.length > 0)
  const hasExternalPath = Boolean(
    session.filePath && session.filePath !== KM_DB_INLINE_PATH
  )
  const linkFields = resolveStoredLinkFields(session.filePath ?? null)

  return {
    id: session.id,
    title: session.title,
    description: session.description,
    sessionDate: session.sessionDate.toISOString(),
    fiscalYear: session.fiscalYear,
    status: session.status,
    fileName: session.fileName,
    hasReport: Boolean(session.fileName && (hasFileData || hasExternalPath)),
    reportSource: linkFields ? linkFields.source : hasFileData || hasExternalPath ? ('upload' as const) : undefined,
    previewUrl: linkFields?.previewUrl,
    externalUrl: linkFields?.externalUrl,
    department: session.department,
    facilitator: {
      id: session.presenter.id,
      name: `${session.presenter.firstName} ${session.presenter.lastName}`.trim(),
    },
    resultsCount: session._count?.results ?? 0,
  }
}

export async function fetchKmSessionDetail(id: string) {
  return prisma.kmSession.findFirst({
    where: { id, isActive: true },
    include: {
      department: true,
      presenter: { select: { id: true, firstName: true, lastName: true } },
      results: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
      innovations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  })
}

function validateKmPdf(file: File): { valid: true } | { valid: false; error: string; code: string } {
  const isPdfMime = file.type === PDF_MIME || file.type === ''
  const isPdfName = file.name.toLowerCase().endsWith('.pdf')
  if (!isPdfMime && !isPdfName) {
    return { valid: false, error: 'รองรับเฉพาะไฟล์ PDF', code: 'KM_INVALID_FILE_TYPE' }
  }
  if (file.size > MAX_PDF_SIZE) {
    return { valid: false, error: 'ไฟล์ใหญ่เกิน 20MB', code: 'KM_FILE_TOO_LARGE' }
  }
  if (file.size === 0) {
    return { valid: false, error: 'ไฟล์ว่างเปล่า', code: 'KM_INVALID_FILE' }
  }
  return { valid: true }
}

export function saveKmSessionFromLink(fileUrl: string) {
  return saveExternalFileLink(fileUrl)
}

/** เก็บ PDF ใน Google Drive หรือ MySQL */
export async function saveKmSessionPdf(sessionId: string, file: File) {
  if (isFileLinkMode('km')) {
    return {
      ok: false as const,
      error: 'โหมด KM ใช้แนบลิงก์ Google Drive เท่านั้น',
      code: 'KM_LINK_ONLY',
    }
  }

  const validation = validateKmPdf(file)
  if (!validation.valid) {
    return { ok: false as const, error: validation.error, code: validation.code }
  }

  const buffer = await fileToBuffer(file)
  const safeName = (file.name || 'km-report.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')

  if (useGoogleDriveForFiles()) {
    const stored = await saveToConfiguredStorage({
      subfolder: `ha-center/km/${sessionId}`,
      fileName: safeName,
      mimeType: PDF_MIME,
      buffer,
    })
    return {
      ok: true as const,
      filePath: stored.filePath,
      fileName: file.name || safeName,
      fileSize: file.size,
      fileData: null as Buffer | null,
    }
  }

  return {
    ok: true as const,
    filePath: KM_DB_INLINE_PATH,
    fileName: file.name || safeName,
    fileSize: file.size,
    fileData: buffer,
  }
}

export async function readKmSessionPdf(session: {
  filePath: string | null
  fileName: string | null
  fileData: Buffer | Uint8Array | null
}): Promise<Buffer> {
  return readStoredBinary({
    filePath: session.filePath,
    fileData: session.fileData,
    inlineMarkers: [KM_DB_INLINE_PATH],
  })
}
