import { apiFetch } from '@/app/common/api-fetch'
import { readApiJson } from '@/app/common/parse-api-response'
import { uploadWithProgress } from '@/app/common/upload-xhr'

export const MAX_DOCUMENT_PDF_BYTES = 50 * 1024 * 1024

export type UploadDocumentInput = {
  title: string
  description?: string
  documentNo?: string
  sectionNo?: string
  categoryId: string
  accessLevel: 'public' | 'internal' | 'confidential'
  file?: File
  fileUrl?: string
  onProgress?: (percent: number, loaded: number) => void
}

export async function uploadDocument(input: UploadDocumentInput): Promise<string> {
  const form = new FormData()
  form.append('title', input.title)
  if (input.description?.trim()) {
    form.append('description', input.description.trim())
  }
  if (input.documentNo?.trim()) {
    form.append('documentNo', input.documentNo.trim())
  }
  if (input.sectionNo?.trim()) {
    form.append('sectionNo', input.sectionNo.trim())
  }
  form.append('categoryId', input.categoryId)
  form.append('accessLevel', input.accessLevel)

  if (input.fileUrl?.trim()) {
    form.append('fileUrl', input.fileUrl.trim())
    const response = await apiFetch('/api/v1/documents', { method: 'POST', body: form })
    const json = await readApiJson<{ success: true; message?: string }>(response)
    return json.message ?? 'บันทึกลิงก์เอกสารสำเร็จ'
  }

  if (!input.file) {
    throw new Error('กรุณาแนบไฟล์ PDF หรือลิงก์ Google Drive')
  }
  if (input.file.type !== 'application/pdf') {
    throw new Error('รองรับเฉพาะไฟล์ PDF')
  }
  if (input.file.size > MAX_DOCUMENT_PDF_BYTES) {
    throw new Error('ไฟล์ใหญ่เกิน 50MB')
  }

  form.append('file', input.file)

  const result = await uploadWithProgress({
    url: '/api/v1/documents',
    method: 'POST',
    body: form,
    onProgress: (p) => input.onProgress?.(p.percent, p.loaded),
  })

  return result.message ?? 'อัปโหลดเอกสารสำเร็จ'
}
