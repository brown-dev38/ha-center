import { isFileLinkMode } from './file-link-mode'

/** เอกสารใช้ลิงก์ Google Drive อย่างเดียว (ไม่อัปโหลด PDF เข้า MySQL) */
export function isDocumentLinkOnlyMode(): boolean {
  return isFileLinkMode('documents')
}
