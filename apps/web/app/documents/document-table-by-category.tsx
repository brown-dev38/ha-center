'use client'

import { FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DocumentRowActions } from '@/app/documents/document-row-actions'
import { FileTypeCell, FileTypeIcon } from '@/app/documents/file-type-icon'
import {
  DocumentNumberCell,
  DocumentSectionBadge,
} from '@/app/documents/document-reference'
import type { CategoryGroup } from '@/app/documents/documents'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { DocumentUpdateStatus } from '@/app/documents/document-update-status'
import { MineBadge } from '@/app/common/mine-badge'
import { WideTableScroll } from '@/app/common/ui/wide-table-scroll'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { cn } from '@/app/common/utils'
import {
  accessLabels,
  formatFileSize,
  type HaDocumentItem,
} from '@/app/documents/documents'
import { sortDocumentsByReference } from '@/app/documents/document-reference'
import { DOCUMENTS_TABLE_COLUMNS } from '@/app/admin/admin-registry'
import { AdminEditableHeader, AdminEditModeHint } from '@/app/admin/admin-inline-edit'
import { useTableColumns } from '@/hooks/use-app-config'
import { useMe } from '@/hooks/use-me'

function useDocTableLayout() {
  const columns = useTableColumns('documents', [...DOCUMENTS_TABLE_COLUMNS])
  const visible = new Set(columns.map((c) => c.id))
  const label = (id: string, fallback: string) =>
    columns.find((c) => c.id === id)?.label ?? fallback
  return { visible, label }
}
function DocumentTableHeader({ timestampLabel = 'วันที่และเวลา' }: { timestampLabel?: string }) {
  const { visible, label } = useDocTableLayout()
  const col = (id: string, fallback: string, thLabel: string) => (
    <AdminEditableHeader
      as="span"
      value={label(id, fallback)}
      scope={{ kind: 'table-column', tableId: 'documents', columnId: id, label: thLabel }}
    />
  )
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      {visible.has('sectionNo') && (
        <TableHead className="sticky left-0 z-20 w-[5.5rem] bg-muted/95 pl-4 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]">
          {col('sectionNo', 'เลขหมวด', 'หัวคอลัมน์: เลขหมวด')}
        </TableHead>
      )}
      {visible.has('documentNo') && (
        <TableHead
          className={cn(
            'sticky z-20 w-[8.5rem] bg-muted/95',
            visible.has('sectionNo') ? 'left-[5.5rem]' : 'left-0',
            !visible.has('title') && 'shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]'
          )}
        >
          {col('documentNo', 'เลขหนังสือ', 'หัวคอลัมน์: เลขหนังสือ')}
        </TableHead>
      )}
      {visible.has('title') && (
        <TableHead
          className={cn(
            'sticky z-20 min-w-[12rem] bg-muted/95 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]',
            visible.has('sectionNo') && visible.has('documentNo')
              ? 'left-[14rem]'
              : visible.has('sectionNo')
                ? 'left-[5.5rem]'
                : visible.has('documentNo')
                  ? 'left-[8.5rem]'
                  : 'left-0'
          )}
        >
          {col('title', 'ชื่อเอกสาร', 'หัวคอลัมน์: ชื่อเอกสาร')}
        </TableHead>
      )}
      {visible.has('haStandard') && (
        <TableHead>{col('haStandard', 'มาตรฐาน HA', 'หัวคอลัมน์: มาตรฐาน HA')}</TableHead>
      )}
      {FEATURE_FLAGS.documentAccessLevel && visible.has('access') && (
        <TableHead>การเข้าถึง</TableHead>
      )}
      {visible.has('file') && <TableHead>{col('file', 'ไฟล์', 'หัวคอลัมน์: ไฟล์')}</TableHead>}
      {visible.has('timestamp') && (
        <TableHead>{col('timestamp', timestampLabel, 'หัวคอลัมน์: วันที่และเวลา')}</TableHead>
      )}
      {visible.has('actions') && (
        <TableHead className="sticky right-0 z-20 bg-muted/95 pr-4 text-right shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.08)]">
          {col('actions', 'จัดการ', 'หัวคอลัมน์: จัดการ')}
        </TableHead>
      )}
    </TableRow>
  )
}

function AccessBadge({ level }: { level: string }) {
  const variant =
    level === 'confidential'
      ? 'destructive'
      : level === 'internal'
        ? 'secondary'
        : 'outline'
  return (
    <Badge variant={variant} className="font-normal">
      {accessLabels[level] ?? level}
    </Badge>
  )
}

function DocumentTableRows({ documents }: { documents: HaDocumentItem[] }) {
  const { visible, label } = useDocTableLayout()
  const { data: me } = useMe()
  return (
    <>
      {documents.map((doc) => {
        const hasFile =
          !!doc.currentVersion?.fileName || doc.currentVersion?.source === 'link'
        const isMine = !!me?.id && doc.uploadedBy?.id === me.id
        return (
          <TableRow
            key={doc.id}
            className={cn(
              'group hover:bg-primary/[0.02]',
              doc.isHidden && 'bg-muted/40 opacity-75',
              isMine && 'bg-emerald-50/30'
            )}
          >
            {visible.has('sectionNo') && (
              <TableCell className="sticky left-0 z-10 w-[5.5rem] bg-background py-3 pl-4 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-muted/40">
                <DocumentSectionBadge sectionNo={doc.sectionNo} />
              </TableCell>
            )}
            {visible.has('documentNo') && (
              <TableCell
                className={cn(
                  'sticky z-10 w-[8.5rem] bg-background py-3 group-hover:bg-muted/40',
                  visible.has('sectionNo') ? 'left-[5.5rem]' : 'left-0',
                  !visible.has('title') && 'shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]'
                )}
              >
                <DocumentNumberCell documentNo={doc.documentNo} />
              </TableCell>
            )}
            {visible.has('title') && (
              <TableCell
                className={cn(
                  'sticky z-10 min-w-[12rem] max-w-md whitespace-normal bg-background py-3 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-muted/40',
                  visible.has('sectionNo') && visible.has('documentNo')
                    ? 'left-[14rem]'
                    : visible.has('sectionNo')
                      ? 'left-[5.5rem]'
                      : visible.has('documentNo')
                        ? 'left-[8.5rem]'
                        : 'left-0'
                )}
              >
              <div className="flex items-start gap-3">
                <FileTypeIcon
                  fileName={doc.currentVersion?.fileName}
                  size="sm"
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium leading-snug text-foreground">{doc.title}</p>
                    {isMine && <MineBadge />}
                    {doc.isHidden && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        ซ่อนอยู่
                      </Badge>
                    )}
                  </div>
                  {doc.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {doc.description}
                    </p>
                  )}
                  <DocumentUpdateStatus
                    className="mt-2"
                    compact
                    updatedAt={doc.updatedAt}
                    fallbackAt={doc.currentVersion?.createdAt ?? doc.createdAt}
                    createdAt={doc.createdAt}
                  />
                </div>
              </div>
              </TableCell>
            )}
            {visible.has('haStandard') && (
              <TableCell className="whitespace-normal py-3 text-muted-foreground">
                {doc.haStandard ?? '—'}
              </TableCell>
            )}
            {FEATURE_FLAGS.documentAccessLevel && visible.has('access') && (
              <TableCell className="py-3">
                <AccessBadge level={doc.accessLevel} />
              </TableCell>
            )}
            {visible.has('file') && (
              <TableCell className="whitespace-normal py-3">
              {doc.currentVersion?.source === 'link' ? (
                <span className="text-xs text-muted-foreground">ลิงก์ Google Drive</span>
              ) : (
                <FileTypeCell
                  fileName={doc.currentVersion?.fileName}
                  fileSize={formatFileSize(doc.currentVersion?.fileSize)}
                  version={doc.currentVersion?.version}
                />
              )}
              </TableCell>
            )}
            {visible.has('timestamp') && (
              <TableCell className="min-w-[10rem] py-3 text-muted-foreground">
              <p className="mb-2 text-xs font-medium text-foreground/80">
                {doc.uploadedBy?.name ?? '—'}
              </p>
              <RecordTimestamp
                iso={doc.currentVersion?.createdAt ?? doc.createdAt}
                label="uploaded"
                variant="compact"
                secondaryIso={
                  doc.updatedAt !== (doc.currentVersion?.createdAt ?? doc.createdAt)
                    ? doc.updatedAt
                    : undefined
                }
                secondaryLabel="updated"
                showRelative
              />
              </TableCell>
            )}
            {visible.has('actions') && (
              <TableCell className="sticky right-0 z-10 bg-background py-3 pr-4 text-right shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-muted/40">
              <DocumentRowActions
                documentId={doc.id}
                title={doc.title}
                fileName={doc.currentVersion?.fileName}
                versionId={doc.currentVersion?.id}
                hasFile={hasFile}
                source={doc.currentVersion?.source}
                previewUrl={doc.currentVersion?.previewUrl}
                externalUrl={doc.currentVersion?.externalUrl}
                compact
                editData={{
                  id: doc.id,
                  title: doc.title,
                  description: doc.description,
                  sectionNo: doc.sectionNo,
                  documentNo: doc.documentNo,
                  categoryCode: doc.category?.code,
                  accessLevel: doc.accessLevel,
                  uploadedBy: doc.uploadedBy,
                }}
                isHidden={doc.isHidden}
              />
              </TableCell>
            )}
          </TableRow>
        )
      })}
    </>
  )
}

type DocumentTableByCategoryProps = {
  groups: CategoryGroup[]
}

export function DocumentTableByCategory({ groups }: DocumentTableByCategoryProps) {
  if (groups.length === 0) return null

  return (
    <div className="space-y-6">
      <AdminEditModeHint />
      {groups.map(({ category, documents }) => (
        <section key={category.id} className={cn(surfaceCardClass(), "overflow-hidden")}>
          <div className="flex items-start gap-3 border-b border-border bg-gradient-to-r from-primary/[0.06] via-ha-green/[0.04] to-transparent px-5 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                {category.sortOrder > 0 && (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    หมวด {String(category.sortOrder).padStart(2, '0')}
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-[10px]">
                  {category.code}
                </Badge>
                <Badge variant="secondary">{documents.length} รายการ</Badge>
              </div>
              {category.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>

          <WideTableScroll hint="เลื่อนขวาเพื่อดูคอลัมน์อื่น — ชื่อเอกสารและจัดการจะค้างให้อ่านได้">
          <Table containerClassName="overflow-x-visible">
            <TableHeader>
              <DocumentTableHeader />
            </TableHeader>
            <TableBody>
              <DocumentTableRows documents={documents} />
            </TableBody>
          </Table>
          </WideTableScroll>
        </section>
      ))}
    </div>
  )
}

/** ตารางเดียวเมื่อเลือกกรองหมวดหมู่เฉพาะ */
export function DocumentTableFlat({ documents }: { documents: HaDocumentItem[] }) {
  const sorted = sortDocumentsByReference(documents)
  if (sorted.length === 0) return null

  return (
    <section className={cn(surfaceCardClass(), 'overflow-hidden')}>
      <div className="px-4 pt-3">
        <AdminEditModeHint />
      </div>
      <WideTableScroll hint="เลื่อนขวาเพื่อดูคอลัมน์อื่น — ชื่อเอกสารและจัดการจะค้างให้อ่านได้">
      <Table containerClassName="overflow-x-visible">
        <TableHeader>
          <DocumentTableHeader timestampLabel="อัปเดต" />
        </TableHeader>
        <TableBody>
          <DocumentTableRows documents={sorted} />
        </TableBody>
      </Table>
      </WideTableScroll>
    </section>
  )
}
