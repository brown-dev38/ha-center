'use client'

import { useState } from 'react'
import { ArrowDownToLine, Loader2, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { HaV6DocOverride } from '@/app/admin/admin-api'
import { cn } from '@/app/common/utils'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { useSaveSettings } from '@/hooks/use-admin'
import { usePermissions } from '@/hooks/use-permissions'

export type AdminTextScope =
  | { kind: 'ha-v6-doc'; docId: string; field: keyof HaV6DocOverride; label: string }
  | { kind: 'table-column'; tableId: string; columnId: string; label: string }
  | { kind: 'ui-label'; key: string; label: string }
  | { kind: 'page-text'; pageKey: string; field: 'title' | 'description' | 'tableTitle' | 'tableDescription'; label: string }
  | { kind: 'ha-v6-group'; groupKey: string; label: string }

function buildPatch(scope: AdminTextScope, value: string) {
  switch (scope.kind) {
    case 'ha-v6-doc':
      return { haV6DocOverrides: { [scope.docId]: { [scope.field]: value } } }
    case 'table-column':
      return {
        tableColumns: {
          [scope.tableId]: { hidden: [], labels: { [scope.columnId]: value } },
        },
      }
    case 'ui-label':
      return { uiLabels: { [scope.key]: value } }
    case 'page-text':
      return { pageText: { [scope.pageKey]: { [scope.field]: value } } }
    case 'ha-v6-group':
      return { uiLabels: { [`haV6.group.${scope.groupKey}`]: value } }
  }
}

function buildClearPatch(scope: AdminTextScope) {
  switch (scope.kind) {
    case 'ha-v6-doc':
      return { haV6DocOverrides: { [scope.docId]: { [scope.field]: '' } } }
    case 'table-column':
      return {
        tableColumns: {
          [scope.tableId]: { hidden: [], labels: { [scope.columnId]: '' } },
        },
      }
    case 'ui-label':
      return { uiLabels: { [scope.key]: '' } }
    case 'page-text':
      return { pageText: { [scope.pageKey]: { [scope.field]: '' } } }
    case 'ha-v6-group':
      return { uiLabels: { [`haV6.group.${scope.groupKey}`]: '' } }
  }
}

type AdminEditableTextProps = {
  value: string
  scope: AdminTextScope
  className?: string
  textClassName?: string
  multiline?: boolean
  placeholder?: string
  /** ค่าเริ่มต้นจาก seed — ใช้ปุ่มคืนค่า */
  defaultValue?: string
}

/** ข้อความที่แอดมินแก้ได้ — แสดงไอคอนดินสอเมื่อ hover */
export function AdminEditableText({
  value,
  scope,
  className,
  textClassName,
  multiline = false,
  placeholder,
  defaultValue,
}: AdminEditableTextProps) {
  const { isAdmin } = usePermissions()
  const saveMutation = useSaveSettings()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  const canEdit = isAdmin()

  const handleOpen = () => {
    setDraft(value)
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(buildPatch(scope, draft.trim()))
      showSuccessToast('บันทึกข้อความแล้ว')
      setOpen(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const handleReset = async () => {
    try {
      await saveMutation.mutateAsync(buildClearPatch(scope))
      showSuccessToast('คืนค่าเริ่มต้นแล้ว')
      setOpen(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'คืนค่าไม่สำเร็จ')
    }
  }

  if (!canEdit) {
    return <span className={cn(textClassName, className)}>{value || placeholder || '—'}</span>
  }

  return (
    <>
      <span className={cn('group/edit inline-flex max-w-full items-start gap-1', className)}>
        <span className={cn('min-w-0 flex-1', textClassName)}>{value || placeholder || '—'}</span>
        <button
          type="button"
          onClick={handleOpen}
          title={`แก้ไข: ${scope.label}`}
          className={cn(
            'inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-transparent',
            'text-muted-foreground/50 opacity-0 transition-all',
            'hover:border-primary/30 hover:bg-primary/10 hover:text-primary',
            'group-hover/edit:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          )}
        >
          <Pencil className="size-3" />
        </button>
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อความ</DialogTitle>
            <DialogDescription>{scope.label}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="admin-edit-field">{scope.label}</Label>
            {multiline ? (
              <textarea
                id="admin-edit-field"
                className="flex min-h-[5rem] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder ?? defaultValue}
                rows={4}
              />
            ) : (
              <Input
                id="admin-edit-field"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder ?? defaultValue}
              />
            )}
            {defaultValue && defaultValue !== value && (
              <p className="text-xs text-muted-foreground">
                ค่าเริ่มต้น: <span className="text-foreground/80">{defaultValue}</span>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {defaultValue ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void handleReset()}>
                <RotateCcw className="size-3.5" />
                คืนค่าเริ่มต้น
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="button" disabled={saveMutation.isPending} onClick={() => void handleSave()}>
                {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'บันทึก'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type AdminEditableHeaderProps = {
  value: string
  scope: AdminTextScope
  className?: string
  as?: 'th' | 'span' | 'h3'
}

/** หัวคอลัมน์/หัวข้อตารางที่แอดมินแก้ได้ */
export function AdminEditableHeader({
  value,
  scope,
  className,
  as: Tag = 'span',
}: AdminEditableHeaderProps) {
  const { isAdmin } = usePermissions()
  const saveMutation = useSaveSettings()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!isAdmin()) {
    return <Tag className={className}>{value}</Tag>
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(buildPatch(scope, draft.trim()))
      showSuccessToast('บันทึกหัวข้อแล้ว')
      setOpen(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  return (
    <>
      <Tag className={cn('group/edit inline-flex items-center gap-1.5', className)}>
        {value}
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setOpen(true)
          }}
          title={`แก้ไข: ${scope.label}`}
          className={cn(
            'inline-flex size-5 shrink-0 items-center justify-center rounded',
            'text-muted-foreground/40 opacity-0 transition-all',
            'hover:bg-primary/10 hover:text-primary',
            'group-hover/edit:opacity-100'
          )}
        >
          <Pencil className="size-2.5" />
        </button>
      </Tag>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขหัวข้อ</DialogTitle>
            <DialogDescription>{scope.label}</DialogDescription>
          </DialogHeader>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={() => void handleSave()}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** แบนเนอร์บอกว่าแอดมินอยู่ในโหมดแก้ไขข้อความ */
export function AdminEditModeHint() {
  const { isAdmin } = usePermissions()
  if (!isAdmin()) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
      <Pencil className="size-3.5 shrink-0" />
      <span>
        โหมดแอดมิน — กด <Pencil className="inline size-3" /> แก้ข้อความ · กด{' '}
        <ArrowDownToLine className="inline size-3" /> แทรกแถวต่อด้านล่าง · กด{' '}
        <Trash2 className="inline size-3" /> ลบ/ซ่อนแถว
      </span>
    </div>
  )
}
