export type HaV6DocStatus = 'not_started' | 'in_progress' | 'review' | 'completed'

export type HaV6StorageLinkItem = {
  id: string
  kind: 'link'
  url: string
  fileName: string
  label?: string
  addedAt: string
  /** ซ่อนจากผู้ใช้ทั่วไป — เฉพาะ admin ที่จัดการได้ */
  hidden?: boolean
}

export type HaV6StorageFileItem = {
  id: string
  kind: 'file'
  fileId: string
  fileName: string
  mimeType: string
  fileSize: number
  addedAt: string
  /** ซ่อนจากผู้ใช้ทั่วไป — เฉพาะ admin ที่จัดการได้ */
  hidden?: boolean
}

export type HaV6StorageItem = HaV6StorageLinkItem | HaV6StorageFileItem

export type HaV6SectionId =
  | 'core'
  | 'section-i'
  | 'section-ii'
  | 'section-iii'
  | 'section-iv'
  | 'sp-pct'

export type HaV6TrackedDocument = {
  id: string
  sectionId: HaV6SectionId
  order: number
  standardCode: string
  /** หัวข้อย่อยในตอน เช่น I-1, I-2 */
  subSection?: string
  title: string
  docType: string
  edition6Status?: string
  responsible: string
  status: HaV6DocStatus
  progressPercent: number
  /** @deprecated ใช้ storageItems แทน — คงไว้เพื่อ migrate ข้อมูลเก่า */
  storageLink?: string
  storageItems: HaV6StorageItem[]
  remarks: string
  /** เวลาที่มีการอัปเดตสถานะ / ไฟล์ / หมายเหตุ ล่าสุด */
  updatedAt?: string
}

export const HA_V6_STATUS_OPTIONS: { value: HaV6DocStatus; label: string }[] = [
  { value: 'not_started', label: 'ยังไม่เริ่ม' },
  { value: 'in_progress', label: 'กำลังจัดทำ' },
  { value: 'review', label: 'ทบทวน' },
  { value: 'completed', label: 'เสร็จสมบูรณ์' },
]

export function statusLabel(status: HaV6DocStatus): string {
  return HA_V6_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

export function defaultProgressForStatus(status: HaV6DocStatus): number {
  switch (status) {
    case 'not_started':
      return 0
    case 'in_progress':
      return 40
    case 'review':
      return 80
    case 'completed':
      return 100
  }
}
