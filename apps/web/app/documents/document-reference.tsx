import { Badge } from '@/components/ui/badge'
import { cn } from '@/app/common/utils'

type DocumentSectionBadgeProps = {
  sectionNo?: string | null
  className?: string
}

/** เลขหมวด — แสดงแบบอ้างอิงมาตรฐาน HA */
export function DocumentSectionBadge({ sectionNo, className }: DocumentSectionBadgeProps) {
  const value = sectionNo?.trim()
  if (!value) {
    return <span className={cn('text-xs text-muted-foreground/50', className)}>—</span>
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-primary/20 bg-primary/[0.06] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-primary',
        className
      )}
    >
      {value}
    </Badge>
  )
}

type DocumentNumberCellProps = {
  documentNo?: string | null
  className?: string
}

/** เลขหนังสือ — แบบอ้างอิงทางการ */
export function DocumentNumberCell({ documentNo, className }: DocumentNumberCellProps) {
  const value = documentNo?.trim()
  if (!value) {
    return <span className={cn('text-xs text-muted-foreground/50', className)}>—</span>
  }

  return (
    <span
      className={cn(
        'inline-block max-w-[10rem] truncate font-mono text-xs font-medium leading-snug text-foreground/90 tabular-nums',
        className
      )}
      title={value}
    >
      {value}
    </span>
  )
}

/** เรียงเอกสารตามเลขหมวด / เลขหนังสือ (ใส่ท้ายรายการถ้าไม่มีเลข) */
export function sortDocumentsByReference<
  T extends { sectionNo?: string | null; documentNo?: string | null; title?: string },
>(documents: T[]): T[] {
  return [...documents].sort((a, b) => {
    const sectionCmp = compareReference(a.sectionNo, b.sectionNo)
    if (sectionCmp !== 0) return sectionCmp
    const docCmp = compareReference(a.documentNo, b.documentNo)
    if (docCmp !== 0) return docCmp
    return (a.title ?? '').localeCompare(b.title ?? '', 'th')
  })
}

function compareReference(a?: string | null, b?: string | null): number {
  const av = a?.trim() ?? ''
  const bv = b?.trim() ?? ''
  if (!av && !bv) return 0
  if (!av) return 1
  if (!bv) return -1
  return av.localeCompare(bv, 'th', { numeric: true, sensitivity: 'base' })
}
