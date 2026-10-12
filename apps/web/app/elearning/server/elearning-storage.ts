import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveUploadRoot } from '@/app/common/server/deployment'

const ELEARN_ROOT = resolveUploadRoot('ELEARNING_UPLOAD_DIR', 'elearning')
const CERT_ROOT = join(ELEARN_ROOT, 'certificates')

const ALLOWED_LESSON_TYPES: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'application/octet-stream', ''],
  pdf: ['application/pdf'],
  slide: [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
}

const MAX_LESSON_FILE = 100 * 1024 * 1024

export async function saveLessonFile(
  courseId: string,
  lessonId: string,
  file: File,
  contentType: string
) {
  const allowed = ALLOWED_LESSON_TYPES[contentType]
  if (!allowed) {
    return { ok: false as const, error: 'ประเภทเนื้อหาไม่รองรับ', code: 'LESSON_INVALID_TYPE' }
  }

  const mimeOk =
    allowed.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.mp4')
  if (!mimeOk && file.type) {
    return { ok: false as const, error: 'ชนิดไฟล์ไม่ตรงกับ contentType', code: 'LESSON_INVALID_FILE' }
  }

  if (file.size > MAX_LESSON_FILE) {
    return { ok: false as const, error: 'ไฟล์ใหญ่เกิน 100MB', code: 'LESSON_FILE_TOO_LARGE' }
  }

  const safeName = (file.name || `file-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_')
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'

  if (useGoogleDriveForFiles()) {
    const stored = await saveToConfiguredStorage({
      subfolder: `ha-center/elearning/lessons/${courseId}/${lessonId}`,
      fileName: safeName,
      mimeType,
      buffer,
    })
    return {
      ok: true as const,
      filePath: stored.filePath,
      fileName: safeName,
      contentUrl: `/api/v1/elearning/courses/${courseId}/lessons/${lessonId}/file`,
    }
  }

  const dir = join(ELEARN_ROOT, 'lessons', courseId, lessonId)
  await mkdir(dir, { recursive: true })
  const filePath = join(dir, safeName)
  await writeFile(filePath, buffer)

  return {
    ok: true as const,
    filePath,
    fileName: safeName,
    contentUrl: `/api/v1/elearning/courses/${courseId}/lessons/${lessonId}/file`,
  }
}

export async function saveCertificatePdf(certificateId: string, buffer: Buffer) {
  if (useGoogleDriveForFiles()) {
    const stored = await saveToConfiguredStorage({
      subfolder: 'ha-center/elearning/certificates',
      fileName: `${certificateId}.pdf`,
      mimeType: 'application/pdf',
      buffer,
    })
    return stored.filePath
  }

  await mkdir(CERT_ROOT, { recursive: true })
  const filePath = join(CERT_ROOT, `${certificateId}.pdf`)
  await writeFile(filePath, buffer)
  return filePath
}

export async function readLessonOrCertificateFile(filePath: string): Promise<Buffer> {
  return readStoredBinary({ filePath })
}
