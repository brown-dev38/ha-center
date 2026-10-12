import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { put } from '@vercel/blob'
import { isFileLinkMode } from '@/app/auth/server/file-link-mode'
import { saveExternalFileLink } from '@/app/auth/server/save-external-link'
import { readStoredBinary, saveToConfiguredStorage } from '@/app/auth/server/stored-file'
import {
  getMeetingFileBackend,
  resolveUploadRoot,
  useGoogleDriveForFiles,
} from '@/app/common/server/deployment'

export const PDF_MIME = 'application/pdf'
export const MAX_PDF_SIZE = 20 * 1024 * 1024

const MEETING_UPLOAD_ROOT = resolveUploadRoot('MEETING_UPLOAD_DIR', 'meetings')

function useBlobStorage(): boolean {
  return getMeetingFileBackend() === 'blob'
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function validatePdfFile(file: File) {
  if (file.type !== PDF_MIME && file.type !== '') {
    return { valid: false as const, error: 'รองรับเฉพาะไฟล์ PDF', code: 'INVALID_FILE_TYPE' }
  }
  if (file.size > MAX_PDF_SIZE) {
    return { valid: false as const, error: 'ไฟล์ใหญ่เกิน 20MB', code: 'FILE_TOO_LARGE' }
  }
  return { valid: true as const }
}

async function savePdfToBackend(params: {
  subfolder: string
  file: File
  safeName: string
  blobKey: string
  diskDir: string
}) {
  const buffer = Buffer.from(await params.file.arrayBuffer())

  if (useGoogleDriveForFiles()) {
    const stored = await saveToConfiguredStorage({
      subfolder: params.subfolder,
      fileName: params.safeName,
      mimeType: PDF_MIME,
      buffer,
    })
    return {
      ok: true as const,
      filePath: stored.filePath,
      fileName: params.safeName,
      fileSize: params.file.size,
    }
  }

  if (useBlobStorage()) {
    const blob = await put(params.blobKey, params.file, {
      access: 'public',
      addRandomSuffix: true,
    })
    return {
      ok: true as const,
      filePath: blob.url,
      fileName: params.safeName,
      fileSize: params.file.size,
    }
  }

  await mkdir(params.diskDir, { recursive: true })
  const filePath = path.join(params.diskDir, params.safeName)
  await writeFile(filePath, buffer)

  return {
    ok: true as const,
    filePath,
    fileName: params.safeName,
    fileSize: params.file.size,
  }
}

export function saveMeetingAgendaFromLink(fileUrl: string) {
  return saveExternalFileLink(fileUrl)
}

export async function saveMeetingMinutesPdf(meetingId: string, file: File) {
  if (isFileLinkMode('meetings')) {
    return {
      ok: false as const,
      error: 'โหมดประชุมใช้แนบลิงก์ Google Drive เท่านั้น',
      code: 'MEETING_LINK_ONLY',
    }
  }

  const validation = validatePdfFile(file)
  if (!validation.valid) return { ok: false as const, error: validation.error, code: validation.code }

  const safeName = sanitizeFileName(file.name || `minutes-${Date.now()}.pdf`)

  return savePdfToBackend({
    subfolder: `ha-center/meetings/${meetingId}/minutes`,
    file,
    safeName,
    blobKey: `meetings/${meetingId}/minutes/${Date.now()}-${safeName}`,
    diskDir: path.join(MEETING_UPLOAD_ROOT, meetingId),
  })
}

export async function saveMeetingAgendaPdf(meetingId: string, agendaId: string, file: File) {
  if (isFileLinkMode('meetings')) {
    return {
      ok: false as const,
      error: 'โหมดประชุมใช้แนบลิงก์ Google Drive เท่านั้น',
      code: 'MEETING_LINK_ONLY',
    }
  }

  const validation = validatePdfFile(file)
  if (!validation.valid) return { ok: false as const, error: validation.error, code: validation.code }

  const safeName = sanitizeFileName(file.name || `agenda-${Date.now()}.pdf`)

  return savePdfToBackend({
    subfolder: `ha-center/meetings/${meetingId}/agendas/${agendaId}`,
    file,
    safeName,
    blobKey: `meetings/${meetingId}/agendas/${agendaId}/${Date.now()}-${safeName}`,
    diskDir: path.join(MEETING_UPLOAD_ROOT, meetingId, 'agendas', agendaId),
  })
}

export async function readStoredPdf(filePath: string) {
  return readStoredBinary({ filePath })
}
