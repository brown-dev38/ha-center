import { apiFetch } from '@/app/common/api-fetch'

export function getDocumentDownloadUrl(documentId: string, versionId?: string) {
  const qs = versionId ? `?versionId=${encodeURIComponent(versionId)}` : ''
  return `/api/v1/documents/${documentId}/download${qs}`
}

async function parseDownloadError(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { error?: string; message?: string }
    return json.error ?? json.message ?? 'โหลดไฟล์ไม่สำเร็จ'
  } catch {
    return response.status === 403
      ? 'ไม่มีสิทธิ์เปิดเอกสารนี้'
      : response.status === 404
        ? 'ไม่พบไฟล์เอกสาร'
        : 'โหลดไฟล์ไม่สำเร็จ'
  }
}

export async function fetchDocumentPdf(documentId: string, versionId?: string): Promise<Blob> {
  const response = await apiFetch(getDocumentDownloadUrl(documentId, versionId))
  if (!response.ok) {
    throw new Error(await parseDownloadError(response))
  }
  const blob = await response.blob()
  if (!blob.size) {
    throw new Error('ไฟล์ว่างหรือเสียหาย')
  }
  return blob
}

export async function downloadDocumentPdf(
  documentId: string,
  fileName: string,
  versionId?: string
): Promise<void> {
  const blob = await fetchDocumentPdf(documentId, versionId)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
