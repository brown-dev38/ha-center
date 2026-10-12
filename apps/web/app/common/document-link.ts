export const DOCUMENT_URL_PREFIX = 'url:'

export function extractGoogleDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export function isDocumentLinkStorage(filePath: string | null | undefined): boolean {
  return !!filePath?.startsWith(DOCUMENT_URL_PREFIX)
}

export function documentLinkFromStorage(filePath: string): string {
  return filePath.slice(DOCUMENT_URL_PREFIX.length)
}

export function documentLinkToStorage(url: string): string {
  return `${DOCUMENT_URL_PREFIX}${url}`
}

export function buildGoogleDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function resolveDocumentPreviewUrl(params: {
  previewUrl?: string | null
  externalUrl?: string | null
}): { embedUrl: string | null; openUrl: string | null; isDrive: boolean } {
  const preview = params.previewUrl?.trim()
  const external = params.externalUrl?.trim()

  if (preview) {
    const driveId = extractGoogleDriveFileId(preview)
    return {
      embedUrl: driveId ? buildGoogleDrivePreviewUrl(driveId) : preview,
      openUrl: external ?? preview,
      isDrive: !!driveId || preview.includes('drive.google.com'),
    }
  }

  if (external) {
    const normalized = normalizeDocumentLink(external)
    if (normalized.ok) {
      return {
        embedUrl: normalized.previewUrl,
        openUrl: normalized.url,
        isDrive: !!extractGoogleDriveFileId(external),
      }
    }
    return { embedUrl: external, openUrl: external, isDrive: false }
  }

  return { embedUrl: null, openUrl: null, isDrive: false }
}

export function resolveStoredLinkFields(filePath: string | null | undefined) {
  if (!filePath || !isDocumentLinkStorage(filePath)) return null
  const externalUrl = documentLinkFromStorage(filePath)
  const normalized = normalizeDocumentLink(externalUrl)
  return {
    source: 'link' as const,
    externalUrl,
    previewUrl: normalized.ok ? normalized.previewUrl : externalUrl,
  }
}

export function normalizeDocumentLink(input: string):
  | { ok: true; url: string; previewUrl: string; fileName: string }
  | { ok: false; error: string; code: string } {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: 'กรุณาวางลิงก์ไฟล์', code: 'DOCUMENT_LINK_REQUIRED' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: 'ลิงก์ไม่ถูกต้อง', code: 'DOCUMENT_INVALID_LINK' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'ลิงก์ต้องขึ้นต้นด้วย http หรือ https', code: 'DOCUMENT_INVALID_LINK' }
  }

  const driveId = extractGoogleDriveFileId(trimmed)
  if (driveId) {
    const url = `https://drive.google.com/file/d/${driveId}/view`
    const previewUrl = buildGoogleDrivePreviewUrl(driveId)
    return { ok: true, url, previewUrl, fileName: 'google-drive.pdf' }
  }

  return {
    ok: true,
    url: parsed.toString(),
    previewUrl: parsed.toString(),
    fileName: decodeURIComponent(parsed.pathname.split('/').pop() || 'document.pdf'),
  }
}
