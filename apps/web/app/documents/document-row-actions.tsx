'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, EyeOff, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DocumentEditDialog, type DocumentEditData } from '@/app/documents/document-edit-dialog'
import { DocumentViewerDialog } from '@/app/documents/document-viewer-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { hideDocument, restoreDocument } from '@/app/documents/document-api'
import { downloadDocumentPdf } from '@/app/documents/document-file'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

type DocumentRowActionsProps = {
  documentId: string
  title: string
  fileName?: string
  versionId?: string
  hasFile: boolean
  source?: 'upload' | 'link'
  previewUrl?: string
  externalUrl?: string
  compact?: boolean
  isHidden?: boolean
  editData?: DocumentEditData
}

export function DocumentRowActions({
  documentId,
  title,
  fileName,
  versionId,
  hasFile,
  source,
  previewUrl,
  externalUrl,
  compact,
  isHidden = false,
  editData,
}: DocumentRowActionsProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [hideOpen, setHideOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const queryClient = useQueryClient()
  const { canEditHaDocument, canDeleteDocuments } = usePermissions()

  const canEdit = canEditHaDocument(editData?.uploadedBy?.id) && !!editData && !isHidden
  const canHide = canDeleteDocuments() && !isHidden
  const canRestore = canDeleteDocuments() && isHidden
  const showManage = canEdit || canHide || canRestore

  const resolvedFileName = fileName ?? `${title}.pdf`

  const hideMutation = useMutation({
    mutationFn: () => hideDocument(documentId),
    onSuccess: (message) => {
      showSuccessToast(message)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setHideOpen(false)
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'ซ่อนเอกสารไม่สำเร็จ')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreDocument(documentId),
    onSuccess: (message) => {
      showSuccessToast(message)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'แสดงเอกสารอีกครั้งไม่สำเร็จ')
    },
  })

  const handleDownload = async () => {
    if (!hasFile) {
      showErrorToast('เอกสารนี้ยังไม่มีไฟล์ PDF')
      return
    }
    if (source === 'link' && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setDownloading(true)
    try {
      await downloadDocumentPdf(documentId, resolvedFileName, versionId)
      showSuccessToast('ดาวน์โหลดแล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ดาวน์โหลดไม่สำเร็จ')
    } finally {
      setDownloading(false)
    }
  }

  const handleOpen = () => {
    if (!hasFile) {
      showErrorToast('เอกสารนี้ยังไม่มีไฟล์ PDF')
      return
    }
    setViewerOpen(true)
  }

  return (
    <>
      <div className={compact ? 'flex items-center justify-end gap-1' : 'flex flex-wrap items-center gap-2'}>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="gap-1"
          disabled={!hasFile}
          onClick={handleOpen}
        >
          <Eye className="size-3.5" aria-hidden />
          {!compact && 'เปิดอ่าน'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!hasFile || downloading}
          onClick={handleDownload}
        >
          <Download className="size-3.5" aria-hidden />
          {!compact &&
            (source === 'link' ? 'เปิดใน Drive' : downloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด')}
        </Button>

        {canHide && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            onClick={() => setHideOpen(true)}
          >
            <EyeOff className="size-3.5" aria-hidden />
            {!compact && 'ซ่อน'}
          </Button>
        )}
        {canRestore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={restoreMutation.isPending}
            onClick={() => restoreMutation.mutate()}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {!compact && (restoreMutation.isPending ? 'กำลังแสดง...' : 'แสดงอีกครั้ง')}
          </Button>
        )}

        {showManage && canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">จัดการเอกสาร</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                แก้ไข
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {canEdit && editData && (
        <DocumentEditDialog doc={editData} open={editOpen} onOpenChange={setEditOpen} />
      )}

      <Dialog open={hideOpen} onOpenChange={setHideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการซ่อนเอกสาร</DialogTitle>
            <DialogDescription>
              จะซ่อน &quot;{title}&quot; จากรายการ — ผู้ใช้ทั่วไปจะไม่เห็นเอกสารนี้
              แอดมินสามารถเปิดดูและแสดงอีกครั้งได้ภายหลัง
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setHideOpen(false)}
              disabled={hideMutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={hideMutation.isPending}
              onClick={() => hideMutation.mutate()}
            >
              {hideMutation.isPending ? 'กำลังซ่อน...' : 'ซ่อนเอกสาร'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentId={documentId}
        title={title}
        fileName={resolvedFileName}
        versionId={versionId}
        source={source}
        previewUrl={previewUrl}
        externalUrl={externalUrl}
      />
    </>
  )
}
