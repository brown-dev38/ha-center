'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  CloudUpload,
  ClipboardList,
  FileUp,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { normalizeDocumentLink } from '@/app/common/document-link'
import { showErrorToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { uploadHaV6TrackerFile } from '@/app/documents/ha-v6-tracker-api'
import {
  createStorageId,
  formatStorageBytes,
  storageItemLabel,
} from '@/app/documents/ha-v6-storage-utils'
import type { HaV6DocStatus, HaV6StorageItem } from '@/app/documents/ha-v6-tracker-types'
import { useHaV6StatusOptions } from '@/hooks/use-app-config'
import { usePermissions } from '@/hooks/use-permissions'

type PendingFile = {
  localId: string
  file: File
}

export type HaV6StorageSavePayload = {
  items: HaV6StorageItem[]
  status: HaV6DocStatus
}

type HaV6StorageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentTitle: string
  items: HaV6StorageItem[]
  currentStatus: HaV6DocStatus
  /** ลบรายการที่มีอยู่แล้ว — เฉพาะผู้ดูแลระบบ */
  canRemoveItems?: boolean
  onSave: (payload: HaV6StorageSavePayload) => Promise<void> | void
}

const STATUS_OPTION_CLASS: Record<HaV6DocStatus, string> = {
  not_started: 'border-rose-200 bg-rose-50 text-rose-900 data-[active=true]:border-rose-400 data-[active=true]:ring-rose-200',
  in_progress: 'border-sky-200 bg-sky-50 text-sky-900 data-[active=true]:border-sky-400 data-[active=true]:ring-sky-200',
  review: 'border-amber-200 bg-amber-50 text-amber-950 data-[active=true]:border-amber-400 data-[active=true]:ring-amber-200',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900 data-[active=true]:border-emerald-400 data-[active=true]:ring-emerald-200',
}

function cloneItems(items: HaV6StorageItem[]): HaV6StorageItem[] {
  return items.map((item) => ({ ...item }))
}

export function HaV6StorageDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  items,
  currentStatus,
  canRemoveItems = false,
  onSave,
}: HaV6StorageDialogProps) {
  const { isAdmin, isLoading: permissionsLoading } = usePermissions()
  const allowRemove = !permissionsLoading && isAdmin() && canRemoveItems
  const statusOptions = useHaV6StatusOptions()
  const [draftItems, setDraftItems] = useState<HaV6StorageItem[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<HaV6DocStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setDraftItems(cloneItems(items))
    setPendingFiles([])
    setLinkUrl('')
    setLinkLabel('')
    setSelectedStatus(currentStatus)
    setDragOver(false)
  }, [open, items, currentStatus])

  const bumpStatusIfIdle = useCallback(() => {
    setSelectedStatus((prev) => (prev === 'not_started' ? 'in_progress' : prev))
  }, [])

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return
      setPendingFiles((prev) => [
        ...prev,
        ...list.map((file) => ({ localId: createStorageId(), file })),
      ])
      bumpStatusIfIdle()
    },
    [bumpStatusIfIdle]
  )

  const handleAddLink = () => {
    const trimmed = linkUrl.trim()
    if (!trimmed) {
      showErrorToast('กรุณาวางลิงก์')
      return
    }
    const parsed = normalizeDocumentLink(trimmed)
    if (!parsed.ok) {
      showErrorToast(parsed.error)
      return
    }

    setDraftItems((prev) => [
      ...prev,
      {
        id: createStorageId(),
        kind: 'link',
        url: parsed.url,
        fileName: parsed.fileName,
        label: linkLabel.trim() || undefined,
        addedAt: new Date().toISOString(),
      },
    ])
    bumpStatusIfIdle()
    setLinkUrl('')
    setLinkLabel('')
  }

  const removeDraftItem = (id: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== id))
  }

  const removePendingFile = (localId: string) => {
    setPendingFiles((prev) => prev.filter((item) => item.localId !== localId))
  }

  const handleSave = async () => {
    const itemsUnchanged =
      pendingFiles.length === 0 &&
      draftItems.length === items.length &&
      draftItems.every((item, index) => item.id === items[index]?.id)
    const statusUnchanged = selectedStatus === currentStatus

    if (itemsUnchanged && statusUnchanged) {
      onOpenChange(false)
      return
    }

    setSaving(true)
    try {
      const nextItems = [...draftItems]

      for (const pending of pendingFiles) {
        const uploaded = await uploadHaV6TrackerFile(documentId, pending.file)
        nextItems.push({
          id: uploaded.id,
          kind: 'file',
          fileId: uploaded.fileId,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
          addedAt: uploaded.addedAt,
        })
      }

      await onSave({ items: nextItems, status: selectedStatus })
      onOpenChange(false)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const totalCount = draftItems.length + pendingFiles.length
  const selectedStatusLabel =
    statusOptions.find((opt) => opt.value === selectedStatus)?.label ?? selectedStatus

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 pr-6">
            <Paperclip className="size-5 text-primary" />
            ที่จัดเก็บ / ลิงก์
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{documentTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <ClipboardList className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">สถานะจัดทำ</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  เลือกสถานะที่จะแสดงในคอลัมน์ &quot;สถานะจัดทำ&quot; หลังบันทึกสำเร็จ
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {statusOptions.map((opt, index) => {
                const active = selectedStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-active={active}
                    onClick={() => setSelectedStatus(opt.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                      STATUS_OPTION_CLASS[opt.value],
                      active ? 'ring-2 shadow-sm' : 'opacity-90 hover:opacity-100'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        active ? 'bg-slate-900 text-white' : 'bg-white/80 text-slate-600'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">{opt.label}</span>
                    </span>
                    {active ? <CheckCircle2 className="size-4 shrink-0 opacity-80" /> : null}
                  </button>
                )
              })}
            </div>
          </section>

          <Tabs defaultValue="file">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTab value="link" className="gap-2">
                <Link2 className="size-4" />
                แนบลิงก์
              </TabsTab>
              <TabsTab value="file" className="gap-2">
                <FileUp className="size-4" />
                แนบไฟล์
              </TabsTab>
            </TabsList>

            <TabsPanel value="link" className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ha-v6-link-url">ลิงก์เอกสาร</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ha-v6-link-url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="pl-9"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddLink()
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ha-v6-link-label">ชื่อแสดง (ไม่บังคับ)</Label>
                <Input
                  id="ha-v6-link-label"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="เช่น แฟ้มเอกสารบน Google Drive"
                />
              </div>
              <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={handleAddLink}>
                <Plus className="size-4" />
                เพิ่มลิงก์
              </Button>
              <p className="text-xs text-muted-foreground">
                รองรับ Google Drive และลิงก์ https ทั่วไป
              </p>
            </TabsPanel>

            <TabsPanel value="file" className="mt-4 space-y-3">
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  addFiles(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-primary/5'
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CloudUpload className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    รองรับ PDF, Word, Excel, PowerPoint, รูปภาพ — แนบได้หลายไฟล์
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.zip,.txt,.csv"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
            </TabsPanel>
          </Tabs>

          {(draftItems.length > 0 || pendingFiles.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>รายการแนบ ({totalCount})</Label>
              </div>
              <ul className="space-y-2">
                {draftItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 shadow-sm"
                  >
                    <StorageListIcon item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {storageItemLabel(item)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.kind === 'link' ? 'ลิงก์ภายนอก' : formatStorageBytes(item.fileSize)}
                      </p>
                    </div>
                    {allowRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDraftItem(item.id)}
                        aria-label="ลบรายการ"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </li>
                ))}
                {pendingFiles.map((pending) => (
                  <li
                    key={pending.localId}
                    className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5"
                  >
                    <FileTypeIcon fileName={pending.file.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{pending.file.name}</p>
                      <p className="text-xs text-primary/80">
                        รอบันทึก · {formatStorageBytes(pending.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      onClick={() => removePendingFile(pending.localId)}
                      aria-label="ลบไฟล์"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border/60 px-6 py-4 sm:flex-col sm:space-x-0">
          <p className="w-full text-center text-[11px] text-muted-foreground sm:text-left">
            หลังบันทึกสำเร็จ คอลัมน์สถานะจัดทำจะเป็น{' '}
            <span className="font-semibold text-foreground">{selectedStatusLabel}</span>
            {totalCount > 0 ? ` · แนบ ${totalCount} รายการ` : ''}
          </p>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Paperclip className="size-4" />
                  บันทึก ({totalCount})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StorageListIcon({ item }: { item: HaV6StorageItem }) {
  if (item.kind === 'link') {
    return (
      <div className="relative shrink-0">
        <FileTypeIcon fileName={item.fileName} size="sm" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-sky-500 text-white shadow ring-2 ring-white">
          <Link2 className="size-2.5" strokeWidth={2.5} />
        </span>
      </div>
    )
  }
  return <FileTypeIcon fileName={item.fileName} size="sm" />
}
