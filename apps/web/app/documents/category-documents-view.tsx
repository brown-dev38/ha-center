'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useDocuments } from '@/hooks/use-documents'
import { usePermissions } from '@/hooks/use-permissions'
import type { HaDocumentItem } from '@/app/documents/documents'
import { DocumentUploadDialog } from '@/app/documents/document-upload-dialog'
import { DocumentTableFlat } from '@/app/documents/document-table-by-category'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { ListSkeleton } from '@/app/loading-skeletons'
import { cn } from '@/app/common/utils'

type CategoryDocumentsViewProps = {
  pageKey: string
  title: string
  description?: string
  categoryCode: string
  icon: LucideIcon
  emptyTitle?: string
  emptyHint?: string
}

export function CategoryDocumentsView({
  pageKey,
  title,
  description,
  categoryCode,
  icon: Icon,
  emptyTitle = 'ยังไม่มีเอกสารในหมวดนี้',
  emptyHint = 'เพิ่มเอกสารด้วยลิงก์ Google Drive หรืออัปโหลด PDF',
}: CategoryDocumentsViewProps) {
  const { canWriteDocuments } = usePermissions()
  const canUpload = canWriteDocuments()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = useDocuments({
    category: categoryCode,
    page,
    limit: 50,
  })

  const items = (data?.data ?? []) as HaDocumentItem[]
  const total = data?.pagination?.total ?? 0

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader pageKey={pageKey} title={title} description={description}>
        {canUpload && (
          <DocumentUploadDialog
            lockedCategoryCode={categoryCode}
            defaultAccessLevel="internal"
            triggerLabel="อัปโหลดเอกสาร"
          />
        )}
      </AdminEditablePageHeader>

      <section className={cn('flex flex-col gap-5')}>
        {total > 0 && (
          <p className="text-xs text-muted-foreground">ทั้งหมด {total} รายการ</p>
        )}

        {isLoading && <ListSkeleton rows={4} />}

        {isError && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error instanceof Error ? error.message : 'โหลดรายการไม่สำเร็จ'}
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState icon={Icon} title={emptyTitle} description={canUpload ? emptyHint : 'รอผู้ดูแลระบบอัปโหลดเอกสาร'}>
            {canUpload && (
              <DocumentUploadDialog
                lockedCategoryCode={categoryCode}
                defaultAccessLevel="internal"
                triggerLabel="อัปโหลดเอกสาร"
              />
            )}
          </EmptyState>
        )}

        {!isLoading && items.length > 0 && <DocumentTableFlat documents={items} />}
      </section>
    </div>
  )
}
