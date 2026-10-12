'use client'

import { useState } from 'react'
import { Eye, FolderOpen, Paperclip, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HaV6StorageDialog } from '@/app/documents/ha-v6-storage-dialog'
import { HaV6StorageViewerDialog } from '@/app/documents/ha-v6-storage-viewer-dialog'
import {
  filterVisibleStorageItems,
  normalizeHaV6Document,
} from '@/app/documents/ha-v6-storage-utils'
import { useUILabel } from '@/hooks/use-app-config'
import { usePermissions } from '@/hooks/use-permissions'
import {
  defaultProgressForStatus,
  type HaV6StorageItem,
  type HaV6TrackedDocument,
} from '@/app/documents/ha-v6-tracker-types'
import type { HaV6StorageSavePayload } from '@/app/documents/ha-v6-storage-dialog'
import { useHaV6DocumentMutations } from '@/app/documents/use-ha-v6-tracker'

type HaV6StorageCellProps = {
  doc: HaV6TrackedDocument
  canEdit: boolean
}

export function HaV6StorageCell({ doc, canEdit }: HaV6StorageCellProps) {
  const addLabel = useUILabel('haV6.storage.add', 'เพิ่มลิงก์ / ไฟล์')
  const manageLabel = useUILabel('haV6.storage.manage', 'จัดการ')
  const viewLabel = useUILabel('haV6.storage.view', 'ดูไฟล์')
  const emptyDash = useUILabel('common.empty', '—')
  const { isAdmin, isLoading: permissionsLoading } = usePermissions()
  // ปุ่มซ่อน/ลบ เฉพาะ role admin เท่านั้น — สิทธิ์อื่นไม่เห็น
  const canAdminStorage = !permissionsLoading && isAdmin()
  const { updateDocument } = useHaV6DocumentMutations()

  const allItems = normalizeHaV6Document(doc).storageItems
  const publicCount = filterVisibleStorageItems(allItems).length
  const manageItems = canAdminStorage ? allItems : filterVisibleStorageItems(allItems)
  const buttonCount = canAdminStorage ? allItems.length : publicCount
  const hasItemsToShow = buttonCount > 0

  const [manageOpen, setManageOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const persistItems = async (nextItems: HaV6StorageItem[], status = doc.status) => {
    await updateDocument(doc.id, {
      storageItems: nextItems,
      storageLink: '',
      status,
      progressPercent: defaultProgressForStatus(status),
    })
  }

  const handleSave = async ({ items: nextFromDialog, status }: HaV6StorageSavePayload) => {
    const nextItems = canAdminStorage
      ? nextFromDialog
      : [
          ...nextFromDialog.filter((item) => !item.hidden),
          ...allItems.filter((item) => Boolean(item.hidden)),
        ]
    await persistItems(nextItems, status)
  }

  if (!hasItemsToShow) {
    if (!canEdit) {
      return <span className="text-xs text-muted-foreground">{emptyDash}</span>
    }
    return (
      <>
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/20 px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="size-3.5" />
          {addLabel}
        </button>
        <HaV6StorageDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          documentId={doc.id}
          documentTitle={doc.title}
          items={manageItems}
          currentStatus={doc.status}
          canRemoveItems={canAdminStorage}
          onSave={handleSave}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-fit gap-1.5 px-2 text-[11px] text-muted-foreground"
          onClick={() => setViewerOpen(true)}
        >
          <Eye className="size-3.5" />
          {viewLabel} ({buttonCount})
        </Button>

        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-fit gap-1.5 px-2 text-[11px] text-muted-foreground"
            onClick={() => setManageOpen(true)}
          >
            <FolderOpen className="size-3.5" />
            {manageLabel}
          </Button>
        )}
      </div>

      <HaV6StorageViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentTitle={doc.title}
        items={allItems}
        canEdit={canEdit}
        canAdminStorage={canAdminStorage}
        onAddFiles={() => setManageOpen(true)}
        onItemsChange={(next) => persistItems(next)}
      />

      <HaV6StorageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        documentId={doc.id}
        documentTitle={doc.title}
        items={manageItems}
        currentStatus={doc.status}
        canRemoveItems={canAdminStorage}
        onSave={handleSave}
      />
    </>
  )
}

export function HaV6StorageColumnHint() {
  const hint = useUILabel('haV6.storage.hint', 'ดูไฟล์ / จัดการ')
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
      <Paperclip className="size-3" />
      {hint}
    </span>
  )
}
