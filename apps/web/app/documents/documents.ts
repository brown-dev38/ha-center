import type { DocumentCategory } from '@/hooks/use-document-categories'
import { sortDocumentsByReference } from '@/app/documents/document-reference'

export type HaDocumentItem = {
  id: string
  title: string
  description: string | null
  documentNo: string | null
  sectionNo: string | null
  haStandard: string | null
  accessLevel: string
  category: { id: string; code: string; name: string }
  uploadedBy: { id: string; name: string }
  currentVersion: {
    id: string
    version: string
    fileName: string
    fileSize: number | null
    isCurrent: boolean
    createdAt: string
    source?: 'upload' | 'link'
    externalUrl?: string
    previewUrl?: string
    mimeType?: string | null
  } | null
  createdAt: string
  updatedAt: string
  /** เอกสารที่ซ่อนแล้ว — แสดงเฉพาะแอดมินเมื่อเปิดตัวกรอง */
  isHidden?: boolean
}

export const ACCESS_LEVEL_OPTIONS = [
  { value: '', label: 'ทุกระดับการเข้าถึง' },
  { value: 'public', label: 'สาธารณะ' },
  { value: 'internal', label: 'ภายใน' },
  { value: 'confidential', label: 'ลับ' },
] as const

export const accessLabels: Record<string, string> = {
  public: 'สาธารณะ',
  internal: 'ภายใน',
  confidential: 'ลับ',
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { formatDateTimeThai as formatDocumentDateTime, formatDateThai as formatDocumentDate } from '@/app/common/datetime'

export type CategoryGroup = {
  category: DocumentCategory
  documents: HaDocumentItem[]
}

export function groupDocumentsByCategory(
  documents: HaDocumentItem[],
  categories: DocumentCategory[]
): CategoryGroup[] {
  const byCode = new Map<string, HaDocumentItem[]>()
  for (const doc of documents) {
    const code = doc.category?.code ?? '_other'
    const list = byCode.get(code) ?? []
    list.push(doc)
    byCode.set(code, list)
  }

  const groups: CategoryGroup[] = []

  for (const cat of categories) {
    const docs = byCode.get(cat.code)
    if (docs && docs.length > 0) {
      groups.push({ category: cat, documents: sortDocumentsByReference(docs) })
      byCode.delete(cat.code)
    }
  }

  const remaining = byCode.get('_other')
  if (remaining?.length) {
    groups.push({
      category: {
        id: '_other',
        code: '_other',
        name: 'ไม่ระบุหมวดหมู่',
        description: null,
        sortOrder: 999,
        documentCount: remaining.length,
      },
      documents: sortDocumentsByReference(remaining),
    })
  }

  for (const [code, docs] of byCode) {
    if (code === '_other') continue
    const cat = categories.find((c) => c.code === code)
    groups.push({
      category:
        cat ??
        ({
          id: code,
          code,
          name: code,
          description: null,
          sortOrder: 998,
          documentCount: docs.length,
        } as DocumentCategory),
      documents: sortDocumentsByReference(docs),
    })
  }

  return groups
}
