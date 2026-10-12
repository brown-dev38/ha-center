import {
  documentLinkToStorage,
  normalizeDocumentLink,
} from '@/app/common/document-link'

export function saveExternalFileLink(fileUrl: string) {
  const parsed = normalizeDocumentLink(fileUrl)
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error, code: parsed.code }
  }

  return {
    ok: true as const,
    filePath: documentLinkToStorage(parsed.url),
    fileName: parsed.fileName,
    fileSize: null as number | null,
    fileData: null as Buffer | null,
    externalUrl: parsed.url,
    previewUrl: parsed.previewUrl,
  }
}
