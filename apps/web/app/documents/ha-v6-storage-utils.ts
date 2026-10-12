import { normalizeDocumentLink } from '@/app/common/document-link'
import type { HaV6StorageItem, HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export function createStorageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function normalizeHaV6Document(doc: HaV6TrackedDocument): HaV6TrackedDocument {
  const storageItems = [...(doc.storageItems ?? [])]
  const legacyLink = doc.storageLink?.trim()

  if (storageItems.length === 0 && legacyLink) {
    const parsed = normalizeDocumentLink(legacyLink)
    storageItems.push({
      id: createStorageId(),
      kind: 'link',
      url: parsed.ok ? parsed.url : legacyLink,
      fileName: parsed.ok ? parsed.fileName : 'ลิงก์ภายนอก',
      // อย่าใช้ Date.now() — จะทำให้ทุกแถวดูเหมือนเพิ่งอัปเดตทุกครั้งที่ normalize
      addedAt: doc.updatedAt && !Number.isNaN(Date.parse(doc.updatedAt)) ? doc.updatedAt : '',
    })
  }

  return {
    ...doc,
    storageItems,
    storageLink: legacyLink ?? '',
  }
}

export function storageItemLabel(item: HaV6StorageItem): string {
  if (item.kind === 'link') {
    return item.label?.trim() || item.fileName
  }
  return item.fileName
}

export function storageItemCount(doc: HaV6TrackedDocument): number {
  return normalizeHaV6Document(doc).storageItems.length
}

/** รายการที่แสดงให้ผู้ใช้ทั่วไป — admin ส่ง includeHidden=true เพื่อเห็นไฟล์ที่ซ่อน */
export function filterVisibleStorageItems(
  items: HaV6StorageItem[],
  options?: { includeHidden?: boolean }
): HaV6StorageItem[] {
  if (options?.includeHidden) return items
  return items.filter((item) => !item.hidden)
}

/** เรียงรายการแนบใหม่สุดก่อน (ไม่มีวันที่อยู่ท้าย) */
export function sortStorageItemsByNewest(items: HaV6StorageItem[]): HaV6StorageItem[] {
  return [...items].sort((a, b) => {
    const ta = a.addedAt ? Date.parse(a.addedAt) : NaN
    const tb = b.addedAt ? Date.parse(b.addedAt) : NaN
    const aOk = !Number.isNaN(ta)
    const bOk = !Number.isNaN(tb)
    if (aOk && bOk) return tb - ta
    if (aOk) return -1
    if (bOk) return 1
    return 0
  })
}

/** มีกิจกรรมจริง (สถานะ / ไฟล์ / หมายเหตุ) — ไม่นับแถวว่างที่สร้างค้างไว้ใน DB */
export function hasHaV6MeaningfulActivity(doc: HaV6TrackedDocument): boolean {
  const items = normalizeHaV6Document(doc).storageItems
  if (items.length > 0) return true
  if (doc.status !== 'not_started') return true
  if ((doc.progressPercent ?? 0) > 0) return true
  if (doc.remarks?.trim()) return true
  return false
}

/**
 * เวลาอัปเดตที่น่าเชื่อถือสำหรับแสดงผล
 * — ไม่ใช้ updatedAt ของแถวว่าง (ยังไม่เริ่ม + ไม่มีไฟล์)
 * — ใช้ค่าล่าสุดระหว่าง updatedAt กับไฟล์/ลิงก์ที่แนบ
 */
export function getHaV6DocumentUpdatedAt(doc: HaV6TrackedDocument): string | null {
  if (!hasHaV6MeaningfulActivity(doc)) return null

  const candidates: string[] = []
  if (doc.updatedAt) {
    const t = Date.parse(doc.updatedAt)
    if (!Number.isNaN(t)) candidates.push(doc.updatedAt)
  }

  for (const item of normalizeHaV6Document(doc).storageItems) {
    if (!item.addedAt) continue
    const t = Date.parse(item.addedAt)
    if (!Number.isNaN(t)) candidates.push(item.addedAt)
  }

  if (candidates.length === 0) return null
  return candidates.reduce((latest, iso) => (iso > latest ? iso : latest))
}
