'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownUp,
  Download,
  Info,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/app/common/utils'
import type { HaDocumentItem } from '@/app/documents/documents'
import { DocumentEditDialog, type DocumentEditData } from '@/app/documents/document-edit-dialog'
import { DocumentViewerDialog } from '@/app/documents/document-viewer-dialog'
import { hideDocument } from '@/app/documents/document-api'
import { downloadDocumentPdf } from '@/app/documents/document-file'
import {
  formatQualityEffectiveDate,
  parseQualityDocumentMeta,
} from '@/app/documents/quality-document-meta'
import { usePermissions } from '@/hooks/use-permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type SortKey = 'code' | 'title' | 'other' | 'effectiveDate' | 'status'

type QualityDocumentsTableProps = {
  documents: HaDocumentItem[]
  page: number
  pageSize: number
}

function SortableHead({
  label,
  active,
  onClick,
  className,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <TableHead className={cn('whitespace-nowrap bg-slate-100 text-slate-700', className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-semibold"
        onClick={onClick}
      >
        {label}
        <ArrowDownUp className={cn('size-3.5', active ? 'text-sky-600' : 'text-slate-400')} />
      </button>
    </TableHead>
  )
}

function ActionIconButton({
  className,
  title,
  onClick,
  disabled,
  children,
}: {
  className: string
  title: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
    >
      {children}
    </button>
  )
}

function RowActions({ doc }: { doc: HaDocumentItem }) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [hideOpen, setHideOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const queryClient = useQueryClient()
  const { canEditHaDocument, canDeleteDocuments } = usePermissions()

  const hasFile = !!doc.currentVersion
  const source = doc.currentVersion?.source
  const externalUrl = doc.currentVersion?.externalUrl
  const previewUrl = doc.currentVersion?.previewUrl
  const canEdit = canEditHaDocument(doc.uploadedBy?.id) && !doc.isHidden
  const canHide = canDeleteDocuments() && !doc.isHidden

  const editData: DocumentEditData = {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    documentNo: doc.documentNo,
    sectionNo: doc.sectionNo,
    categoryCode: doc.category?.code,
    accessLevel: doc.accessLevel,
    uploadedBy: doc.uploadedBy,
  }

  const hideMutation = useMutation({
    mutationFn: () => hideDocument(doc.id),
    onSuccess: (message) => {
      showSuccessToast(message)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setHideOpen(false)
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'ซ่อนเอกสารไม่สำเร็จ')
    },
  })

  const handleOpen = () => {
    if (!hasFile) {
      showErrorToast('เอกสารนี้ยังไม่มีไฟล์')
      return
    }
    setViewerOpen(true)
  }

  const handleDownload = async () => {
    if (!hasFile) {
      showErrorToast('เอกสารนี้ยังไม่มีไฟล์')
      return
    }
    if (source === 'link' && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setDownloading(true)
    try {
      await downloadDocumentPdf(
        doc.id,
        doc.currentVersion?.fileName ?? `${doc.title}.pdf`,
        doc.currentVersion?.id
      )
      showSuccessToast('ดาวน์โหลดแล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ดาวน์โหลดไม่สำเร็จ')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <ActionIconButton className="bg-sky-600" title="ดูรายละเอียด" onClick={handleOpen} disabled={!hasFile}>
          <Info className="size-3.5" />
        </ActionIconButton>
        <ActionIconButton
          className="bg-amber-500"
          title="แก้ไข"
          onClick={() => setEditOpen(true)}
          disabled={!canEdit}
        >
          <Pencil className="size-3.5" />
        </ActionIconButton>
        <ActionIconButton
          className="bg-teal-600"
          title={source === 'link' ? 'เปิดใน Drive' : 'ดาวน์โหลด'}
          onClick={() => void handleDownload()}
          disabled={!hasFile || downloading}
        >
          <Download className="size-3.5" />
        </ActionIconButton>
        <ActionIconButton
          className="bg-rose-600"
          title="ซ่อนเอกสาร"
          onClick={() => setHideOpen(true)}
          disabled={!canHide}
        >
          <Trash2 className="size-3.5" />
        </ActionIconButton>
      </div>

      {canEdit && (
        <DocumentEditDialog doc={editData} open={editOpen} onOpenChange={setEditOpen} />
      )}

      <DocumentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        documentId={doc.id}
        title={doc.title}
        fileName={doc.currentVersion?.fileName}
        versionId={doc.currentVersion?.id}
        source={source}
        previewUrl={previewUrl}
        externalUrl={externalUrl}
      />

      <Dialog open={hideOpen} onOpenChange={setHideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ซ่อนเอกสาร?</DialogTitle>
            <DialogDescription>
              เอกสาร &quot;{doc.title}&quot; จะไม่แสดงในรายการทั่วไป แต่สามารถกู้คืนได้โดยแอดมิน
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHideOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={hideMutation.isPending}
              onClick={() => hideMutation.mutate()}
            >
              {hideMutation.isPending ? 'กำลังซ่อน...' : 'ยืนยันซ่อน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function QualityDocumentsTable({
  documents,
  page,
  pageSize,
}: QualityDocumentsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('code')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const rows = useMemo(() => {
    const mapped = documents.map((doc) => {
      const meta = parseQualityDocumentMeta(doc.description)
      return {
        doc,
        code: doc.documentNo?.trim() || '—',
        title: doc.title,
        other: meta.otherDepartments.join(', ') || '—',
        effectiveDate: meta.effectiveDate,
        effectiveLabel: formatQualityEffectiveDate(meta.effectiveDate),
        status: doc.isHidden ? 'ซ่อน' : 'ใช้งาน',
      }
    })

    mapped.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av =
        sortKey === 'effectiveDate'
          ? a.effectiveDate ?? ''
          : sortKey === 'code'
            ? a.code
            : sortKey === 'title'
              ? a.title
              : sortKey === 'other'
                ? a.other
                : a.status
      const bv =
        sortKey === 'effectiveDate'
          ? b.effectiveDate ?? ''
          : sortKey === 'code'
            ? b.code
            : sortKey === 'title'
              ? b.title
              : sortKey === 'other'
                ? b.other
                : b.status
      return av.localeCompare(bv, 'th', { numeric: true }) * dir
    })

    return mapped
  }, [documents, sortDir, sortKey])

  const startIndex = (page - 1) * pageSize

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 bg-slate-100 text-center font-semibold text-slate-700">
              #
            </TableHead>
            <SortableHead
              label="รหัส"
              active={sortKey === 'code'}
              onClick={() => toggleSort('code')}
              className="w-36"
            />
            <SortableHead
              label="ชื่อเอกสารคุณภาพ"
              active={sortKey === 'title'}
              onClick={() => toggleSort('title')}
            />
            <SortableHead
              label="หน่วยงานอื่นที่ใช้"
              active={sortKey === 'other'}
              onClick={() => toggleSort('other')}
              className="w-36"
            />
            <SortableHead
              label="วันที่บังคับใช้"
              active={sortKey === 'effectiveDate'}
              onClick={() => toggleSort('effectiveDate')}
              className="w-36"
            />
            <SortableHead
              label="สถานะ"
              active={sortKey === 'status'}
              onClick={() => toggleSort('status')}
              className="w-28 text-center"
            />
            <TableHead className="w-40 bg-slate-100 text-center font-semibold text-slate-700">
              จัดการ
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={row.doc.id} className="border-slate-100">
              <TableCell className="text-center tabular-nums text-slate-500">
                {startIndex + i + 1}
              </TableCell>
              <TableCell className="font-mono text-[12px] font-medium text-slate-800">
                {row.code}
              </TableCell>
              <TableCell className="max-w-[28rem] text-[13px] leading-snug text-slate-800">
                {row.title}
              </TableCell>
              <TableCell className="text-[12px] text-slate-600">{row.other}</TableCell>
              <TableCell className="whitespace-nowrap text-[13px] text-slate-700">
                {row.effectiveLabel}
              </TableCell>
              <TableCell className="text-center">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    row.doc.isHidden
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {row.status}
                </span>
              </TableCell>
              <TableCell>
                <RowActions doc={row.doc} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let p = start; p <= end; p += 1) pages.push(p)
  if (end < total - 1) pages.push('ellipsis')
  pages.push(total)
  return pages
}

export function QualityDocumentsPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = pageWindow(page, Math.max(1, totalPages))

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        กำลังแสดง {from.toLocaleString('th-TH')} ถึง {to.toLocaleString('th-TH')} จาก{' '}
        {total.toLocaleString('th-TH')} รายการ
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ก่อนหน้า
        </Button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={p === page ? 'default' : 'outline'}
              className={cn(
                'min-w-8',
                p === page && 'bg-sky-600 hover:bg-sky-700'
              )}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  )
}
