'use client'

import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileStack,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExternalLinkViewerDialog } from '@/app/common/external-link-viewer-dialog'
import { formatDateTimeThai } from '@/app/common/datetime'
import { normalizeDocumentLink } from '@/app/common/document-link'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import {
  deleteHaV6TrackerFile,
  haV6FileDownloadPath,
} from '@/app/documents/ha-v6-tracker-api'
import {
  filterVisibleStorageItems,
  formatStorageBytes,
  sortStorageItemsByNewest,
  storageItemLabel,
} from '@/app/documents/ha-v6-storage-utils'
import type { HaV6StorageItem } from '@/app/documents/ha-v6-tracker-types'
import { usePermissions } from '@/hooks/use-permissions'

type HaV6StorageViewerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentTitle: string
  items: HaV6StorageItem[]
  canEdit?: boolean
  /** ลบ / ซ่อน — เฉพาะผู้ดูแลระบบ */
  canAdminStorage?: boolean
  onAddFiles?: () => void
  onItemsChange?: (items: HaV6StorageItem[]) => Promise<void> | void
}

export function HaV6StorageViewerDialog({
  open,
  onOpenChange,
  documentTitle,
  items,
  canEdit = false,
  canAdminStorage = false,
  onAddFiles,
  onItemsChange,
}: HaV6StorageViewerDialogProps) {
  const { isAdmin, isLoading: permissionsLoading } = usePermissions()
  /** ล็อกชั้นที่ 2 — ถึง prop จะส่งมาผิด สิทธิ์อื่นก็ไม่เห็นปุ่มซ่อน/ลบ */
  const isAdminUser = !permissionsLoading && isAdmin() && canAdminStorage
  const [showHidden, setShowHidden] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [linkViewerOpen, setLinkViewerOpen] = useState(false)
  const [linkItem, setLinkItem] = useState<Extract<HaV6StorageItem, { kind: 'link' }> | null>(null)

  const visibleItems = useMemo(
    () =>
      filterVisibleStorageItems(items, {
        includeHidden: isAdminUser && showHidden,
      }),
    [items, isAdminUser, showHidden]
  )
  const sorted = useMemo(() => sortStorageItemsByNewest(visibleItems), [visibleItems])
  const hiddenCount = items.filter((item) => item.hidden).length

  const openItem = (item: HaV6StorageItem) => {
    if (item.kind === 'link') {
      setLinkItem(item)
      setLinkViewerOpen(true)
      return
    }
    window.open(haV6FileDownloadPath(item.fileId), '_blank', 'noopener,noreferrer')
  }

  const handleAddFiles = () => {
    onOpenChange(false)
    window.setTimeout(() => onAddFiles?.(), 120)
  }

  const persist = async (next: HaV6StorageItem[]) => {
    if (!onItemsChange) return
    await onItemsChange(next)
  }

  const handleHide = async (item: HaV6StorageItem) => {
    if (!isAdminUser) return
    setBusyId(item.id)
    try {
      await persist(items.map((row) => (row.id === item.id ? { ...row, hidden: true } : row)))
      showSuccessToast('ซ่อนไฟล์แล้ว — ผู้ใช้ทั่วไปจะไม่เห็นรายการนี้')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ซ่อนไฟล์ไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  const handleUnhide = async (item: HaV6StorageItem) => {
    if (!isAdminUser) return
    setBusyId(item.id)
    try {
      await persist(items.map((row) => (row.id === item.id ? { ...row, hidden: false } : row)))
      showSuccessToast('ยกเลิกการซ่อนไฟล์แล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ยกเลิกซ่อนไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (item: HaV6StorageItem) => {
    if (!isAdminUser) return
    const label = storageItemLabel(item)
    const ok = window.confirm(
      `ลบ “${label}” ถาวร?\n\nการลบไม่สามารถกู้คืนได้ และทำได้เฉพาะผู้ดูแลระบบ`
    )
    if (!ok) return

    setBusyId(item.id)
    try {
      if (item.kind === 'file') {
        await deleteHaV6TrackerFile(item.fileId)
      }
      await persist(items.filter((row) => row.id !== item.id))
      showSuccessToast('ลบไฟล์เรียบร้อย')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ลบไฟล์ไม่สำเร็จ')
    } finally {
      setBusyId(null)
    }
  }

  const fileCount = sorted.filter((i) => i.kind === 'file').length
  const linkCount = sorted.filter((i) => i.kind === 'link').length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border/60 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 px-6 py-5">
            <div className="flex items-start justify-between gap-3 pr-8">
              <DialogTitle className="flex items-center gap-2.5 text-base">
                <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <FileStack className="size-4" />
                </span>
                รายการไฟล์ที่จัดเก็บ
              </DialogTitle>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {isAdminUser && hiddenCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setShowHidden((v) => !v)}
                  >
                    {showHidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    {showHidden ? 'ซ่อนรายการที่ซ่อน' : `ไฟล์ที่ซ่อน (${hiddenCount})`}
                  </Button>
                )}
                {canEdit && (
                  <Button type="button" size="sm" className="h-8 gap-1.5" onClick={handleAddFiles}>
                    <Plus className="size-3.5" />
                    เพิ่มไฟล์
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription className="mt-1 line-clamp-2 text-xs leading-relaxed">
              {documentTitle}
            </DialogDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white px-2.5 py-0.5 font-medium text-foreground/80">
                แสดง {sorted.length} รายการ
              </span>
              {fileCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  ไฟล์ {fileCount}
                </span>
              )}
              {linkCount > 0 && (
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-medium text-sky-800">
                  ลิงก์ {linkCount}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-muted-foreground/80">
                <Sparkles className="size-3" />
                เรียงไฟล์ล่าสุดก่อน
              </span>
              {isAdminUser && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-medium text-amber-900">
                  โหมดผู้ดูแลระบบ
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="min-h-0 max-h-[min(55vh,28rem)] flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:max-h-[min(60vh,32rem)] sm:px-6">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center">
                <FileStack className="size-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-foreground">ยังไม่มีไฟล์หรือลิงก์</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {showHidden
                      ? 'ไม่มีรายการในมุมมองนี้'
                      : 'เมื่อมีการอัปโหลด รายการจะแสดงที่นี่'}
                  </p>
                </div>
                {canEdit && (
                  <Button type="button" size="sm" className="mt-1 gap-1.5" onClick={handleAddFiles}>
                    <Plus className="size-3.5" />
                    เพิ่มไฟล์
                  </Button>
                )}
              </div>
            ) : (
              <ul className="space-y-2.5 pb-1">
                {sorted.map((item, index) => {
                  const isNewest = index === 0 && !item.hidden
                  const label = storageItemLabel(item)
                  const added = item.addedAt ? formatDateTimeThai(item.addedAt) : null
                  const isLink = item.kind === 'link'
                  const busy = busyId === item.id

                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'group relative overflow-hidden rounded-2xl border bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] transition',
                        item.hidden
                          ? 'border-dashed border-amber-300/80 bg-amber-50/30'
                          : isNewest
                            ? 'border-emerald-200/90 ring-1 ring-emerald-100'
                            : 'border-border/70 hover:border-border'
                      )}
                    >
                      <div className="absolute right-3 top-3 z-10 flex gap-1">
                        {item.hidden && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
                            <EyeOff className="size-2.5" />
                            ซ่อนอยู่
                          </span>
                        )}
                        {isNewest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
                            <Sparkles className="size-2.5" />
                            ล่าสุด
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3 p-3.5 sm:p-4">
                        <div className="relative shrink-0 pt-0.5">
                          <FileTypeIcon fileName={item.fileName} size="md" />
                          {isLink && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-sky-500 text-white shadow ring-2 ring-white">
                              <Link2 className="size-2.5" strokeWidth={2.5} />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="pr-24">
                            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {isLink ? 'ลิงก์ภายนอก' : formatStorageBytes(item.fileSize)}
                              <span className="text-muted-foreground/50"> · </span>
                              #{index + 1} จาก {sorted.length}
                            </p>
                          </div>

                          <div
                            className={cn(
                              'inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-2.5 py-1.5',
                              isNewest
                                ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-950'
                                : 'border-border/60 bg-slate-50/80 text-slate-800'
                            )}
                          >
                            <CalendarClock className="size-3.5 shrink-0 opacity-70" />
                            {added ? (
                              <>
                                <span className="text-[11px] font-semibold">
                                  {added.weekday} {added.date}
                                </span>
                                <span className="text-[10px] opacity-40" aria-hidden>
                                  |
                                </span>
                                <span className="tabular-nums text-[11px] font-medium">
                                  {added.time}
                                </span>
                                {added.relative && (
                                  <>
                                    <span className="text-[10px] opacity-40" aria-hidden>
                                      |
                                    </span>
                                    <span className="text-[11px] opacity-80">{added.relative}</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">ไม่ระบุวันเวลา</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {!item.hidden && (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => openItem(item)}
                                disabled={busy}
                              >
                                {isLink ? (
                                  <>
                                    <ExternalLink className="size-3.5" />
                                    เปิดลิงก์
                                  </>
                                ) : (
                                  <>
                                    <Eye className="size-3.5" />
                                    เปิดไฟล์
                                  </>
                                )}
                              </Button>
                            )}
                            {!item.hidden && !isLink && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => openItem(item)}
                                disabled={busy}
                              >
                                <Download className="size-3.5" />
                                ดาวน์โหลด
                              </Button>
                            )}

                            {isAdminUser && (
                              <>
                                {item.hidden ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5"
                                    onClick={() => handleUnhide(item)}
                                    disabled={busy}
                                  >
                                    {busy ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Eye className="size-3.5" />
                                    )}
                                    ยกเลิกซ่อน
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5"
                                    onClick={() => handleHide(item)}
                                    disabled={busy}
                                  >
                                    {busy ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <EyeOff className="size-3.5" />
                                    )}
                                    ซ่อน
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                                  onClick={() => handleDelete(item)}
                                  disabled={busy}
                                >
                                  {busy ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-3.5" />
                                  )}
                                  ลบ
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {canEdit && sorted.length > 0 && (
            <DialogFooter className="shrink-0 border-t border-border/60 bg-white px-6 py-3 sm:justify-between">
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                {isAdminUser
                  ? 'ผู้ดูแลระบบสามารถซ่อนหรือลบไฟล์ได้'
                  : 'เลื่อนดูรายการได้เมื่อไฟล์มีจำนวนมาก'}
              </p>
              <Button type="button" className="gap-1.5" onClick={handleAddFiles}>
                <Plus className="size-3.5" />
                เพิ่มไฟล์
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {linkItem &&
        (() => {
          const parsed = normalizeDocumentLink(linkItem.url)
          return (
            <ExternalLinkViewerDialog
              open={linkViewerOpen}
              onOpenChange={setLinkViewerOpen}
              title={storageItemLabel(linkItem)}
              fileName={linkItem.fileName}
              externalUrl={linkItem.url}
              previewUrl={parsed.ok ? parsed.previewUrl : linkItem.url}
            />
          )
        })()}
    </>
  )
}
