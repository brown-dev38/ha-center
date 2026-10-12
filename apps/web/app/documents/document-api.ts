import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'

import { readApiJson } from '@/app/common/parse-api-response'

export type UpdateDocumentInput = {
  id: string
  title?: string
  description?: string
  documentNo?: string
  sectionNo?: string
  categoryId?: string
  accessLevel?: 'public' | 'internal' | 'confidential'
  changeNote?: string
  file?: File | null
  fileUrl?: string
}
export async function updateDocument(input: UpdateDocumentInput): Promise<string> {
  const form = new FormData()
  if (input.title !== undefined) form.append('title', input.title)
  if (input.description !== undefined) form.append('description', input.description)
  if (input.documentNo !== undefined) form.append('documentNo', input.documentNo)
  if (input.sectionNo !== undefined) form.append('sectionNo', input.sectionNo)
  if (input.categoryId !== undefined) form.append('categoryId', input.categoryId)
  if (input.accessLevel !== undefined) form.append('accessLevel', input.accessLevel)
  if (input.changeNote?.trim()) form.append('changeNote', input.changeNote.trim())
  if (input.fileUrl?.trim()) form.append('fileUrl', input.fileUrl.trim())
  else if (input.file) form.append('file', input.file)

  const response = await apiFetch(`/api/v1/documents/${input.id}`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: form,
  })

  const json = await readApiJson<{ success: true; message?: string }>(response)
  return typeof json.message === 'string' ? json.message : 'บันทึกเอกสารสำเร็จ'
}

/** ซ่อนเอกสารจากรายการ (เฉพาะแอดมิน) */
export async function hideDocument(id: string): Promise<string> {
  const response = await apiFetch(`/api/v1/documents/${id}`, {
    method: 'DELETE',
    headers: apiHeaders(),
  })

  const json = await readApiJson<{ success: true; message?: string }>(response)
  return typeof json.message === 'string' ? json.message : 'ซ่อนเอกสารแล้ว'
}

/** แสดงเอกสารที่ซ่อนกลับเข้ารายการ (เฉพาะแอดมิน) */
export async function restoreDocument(id: string): Promise<string> {
  const response = await apiFetch(`/api/v1/documents/${id}`, {
    method: 'PATCH',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ restore: true }),
  })

  const json = await readApiJson<{ success: true; message?: string }>(response)
  return typeof json.message === 'string' ? json.message : 'แสดงเอกสารอีกครั้งแล้ว'
}

/** @deprecated ใช้ hideDocument แทน */
export async function deleteDocument(id: string): Promise<string> {
  return hideDocument(id)
}
