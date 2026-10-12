export type FileLinkModule = 'documents' | 'km' | 'meetings' | 'elearning'

const MODULE_ENV: Record<FileLinkModule, string> = {
  documents: 'DOCUMENT_STORAGE_MODE',
  km: 'KM_STORAGE_MODE',
  meetings: 'MEETING_STORAGE_MODE',
  elearning: 'ELEARNING_STORAGE_MODE',
}

/** เปิดโหมดแนบลิงก์ Google Drive ต่อโมดูล */
export function isFileLinkMode(module: FileLinkModule): boolean {
  const global = process.env.FILE_LINK_MODE?.trim().toLowerCase()
  if (global === 'all' || global === 'true' || global === '1') return true

  const perModule = process.env[MODULE_ENV[module]]?.trim().toLowerCase()
  if (perModule === 'link') return true

  // backward compat
  if (module === 'documents') {
    return process.env.DOCUMENT_STORAGE_MODE?.trim().toLowerCase() === 'link'
  }

  return false
}
