import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveUploadRoot } from '@/app/common/server/deployment'

export const MAX_PDF_SIZE = 50 * 1024 * 1024
export const PDF_MIME = 'application/pdf'
export const DB_INLINE_PATH = 'db:inline'

const UPLOAD_ROOT = resolveUploadRoot('DOCUMENT_UPLOAD_DIR', 'documents')

export function validatePdfFile(file: File): { valid: true } | { valid: false; error: string; code: string } {
  const isPdfMime = file.type === PDF_MIME || file.type === ''
  const isPdfName = file.name.toLowerCase().endsWith('.pdf')

  if (!isPdfMime && !isPdfName) {
    return { valid: false, error: 'อนุญาตเฉพาะไฟล์ PDF', code: 'DOCUMENT_INVALID_FILE' }
  }
  if (file.size > MAX_PDF_SIZE) {
    return { valid: false, error: 'ขนาดไฟล์ต้องไม่เกิน 50MB', code: 'DOCUMENT_FILE_TOO_LARGE' }
  }
  if (file.size === 0) {
    return { valid: false, error: 'ไฟล์ว่างเปล่า', code: 'DOCUMENT_INVALID_FILE' }
  }
  return { valid: true }
}

export async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer())
}

export function buildDownloadUrl(documentId: string) {
  return `/api/v1/documents/${documentId}/download`
}

/** อ่าน PDF จาก Google Drive / DB (fileData) / ดิสก์เก่า */
export async function readVersionPdf(version: {
  filePath: string
  fileData: Buffer | Uint8Array | null
}): Promise<Buffer> {
  return readStoredBinary({
    filePath: version.filePath,
    fileData: version.fileData,
    inlineMarkers: [DB_INLINE_PATH],
  })
}

/** บันทึก PDF ตาม backend ที่ตั้งค่า (Drive หรือ MySQL inline) */
export async function saveDocumentPdf(params: {
  documentId: string
  versionLabel: string
  file: File
}) {
  const validation = validatePdfFile(params.file)
  if (!validation.valid) {
    return { ok: false as const, error: validation.error, code: validation.code }
  }

  const buffer = await fileToBuffer(params.file)
  const safeName = `${params.versionLabel.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`
  const fileName = params.file.name || safeName

  if (useGoogleDriveForFiles()) {
    const stored = await saveToConfiguredStorage({
      subfolder: `ha-center/documents/${params.documentId}`,
      fileName,
      mimeType: PDF_MIME,
      buffer,
    })
    return {
      ok: true as const,
      filePath: stored.filePath,
      fileName,
      fileSize: params.file.size,
      fileUrl: buildDownloadUrl(params.documentId),
      fileData: null as Buffer | null,
    }
  }

  return {
    ok: true as const,
    filePath: DB_INLINE_PATH,
    fileName,
    fileSize: params.file.size,
    fileUrl: buildDownloadUrl(params.documentId),
    fileData: buffer,
  }
}

/** @deprecated เก็บบนดิสก์ — ใช้เฉพาะข้อมูลเก่าก่อนย้ายมา DB */
export async function savePdfFileToDisk(documentId: string, versionLabel: string, file: File) {
  const dir = path.join(UPLOAD_ROOT, documentId)
  await mkdir(dir, { recursive: true })

  const safeName = `${versionLabel.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`
  const filePath = path.join(dir, safeName)
  const buffer = await fileToBuffer(file)
  await writeFile(filePath, buffer)

  return {
    filePath,
    fileName: file.name || safeName,
    fileSize: file.size,
    fileUrl: buildDownloadUrl(documentId),
    fileData: buffer,
  }
}

function resolveStoredFile(filePath: string): string | null {
  const absolute = path.resolve(filePath)
  if (!absolute.startsWith(UPLOAD_ROOT)) return null
  if (!existsSync(absolute)) return null
  return absolute
}

async function readStoredPdfFromDisk(filePath: string) {
  const absolute = resolveStoredFile(filePath)
  if (!absolute) throw new Error('FILE_NOT_FOUND')
  return readFile(absolute)
}

/** @deprecated ใช้ readVersionPdf แทน */
export async function readStoredPdf(filePath: string) {
  return readStoredPdfFromDisk(filePath)
}
