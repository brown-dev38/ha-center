'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AdminPageShell } from '@/app/admin/admin-page-shell'
import {
  createQualityLevel,
  deleteQualityLevel,
  fetchAdminQualityLevels,
  updateQualityLevel,
  type QualityDocumentLevel,
} from '@/app/admin/admin-api'
import { SurfaceCard } from '@/app/common/ui/surface-card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 10

type SortKey = 'order' | 'code' | 'name'
type LevelForm = { order: string; code: string; name: string }

const emptyForm = (): LevelForm => ({ order: '', code: '', name: '' })

export function QualityLevelsManagerPage() {
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'quality-levels'] })
    queryClient.invalidateQueries({ queryKey: ['quality-document-levels'] })
  }
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'quality-levels'],
    queryFn: fetchAdminQualityLevels,
  })
  const createMutation = useMutation({ mutationFn: createQualityLevel, onSuccess: refresh })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; order?: number; code?: string; name?: string }) =>
      updateQualityLevel(id, input),
    onSuccess: refresh,
  })
  const deleteMutation = useMutation({ mutationFn: deleteQualityLevel, onSuccess: refresh })
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('order')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<LevelForm>(emptyForm)
  const [removeTarget, setRemoveTarget] = useState<QualityDocumentLevel | null>(null)

  const rows = data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q
      ? rows.filter(
          (row) => row.code.toLowerCase().includes(q) || row.name.toLowerCase().includes(q)
        )
      : rows
    const sorted = [...matched].sort((a, b) => {
      const left = sortKey === 'order' ? a.order : a[sortKey]
      const right = sortKey === 'order' ? b.order : b[sortKey]
      const cmp =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'th')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [rows, query, sortDir, sortKey])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : start + 1
  const to = Math.min(start + PAGE_SIZE, filtered.length)
  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const toggleSort = (key: SortKey) => {
    setPage(1)
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const openCreate = () => {
    const nextOrder = rows.reduce((max, row) => Math.max(max, row.order), 0) + 1
    setEditId(null)
    setForm({ order: String(nextOrder), code: '', name: '' })
    setOpen(true)
  }

  const openEdit = (row: QualityDocumentLevel) => {
    setEditId(row.id)
    setForm({ order: String(row.order), code: row.code, name: row.name })
    setOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      order: Number(form.order),
      code: form.code.trim(),
      name: form.name.trim(),
    }
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload })
        showSuccessToast('แก้ไขระดับเอกสารคุณภาพแล้ว')
      } else {
        await createMutation.mutateAsync(payload)
        showSuccessToast('เพิ่มระดับเอกสารคุณภาพแล้ว')
      }
      setOpen(false)
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const handleDelete = async () => {
    if (!removeTarget) return
    try {
      await deleteMutation.mutateAsync(removeTarget.id)
      showSuccessToast('ลบระดับเอกสารคุณภาพแล้ว')
      setRemoveTarget(null)
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <AdminPageShell
      pageKey="admin-quality-levels"
      title="ระดับเอกสารคุณภาพ"
      description="แสดงระดับเอกสารคุณภาพทั้งหมด ใช้เป็นรหัสตอนเพิ่มเอกสารคุณภาพ"
      icon={Layers}
    >
      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            เพิ่มระดับเอกสารคุณภาพ
          </Button>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="ค้นหา"
              className="h-9 pl-9"
              aria-label="ค้นหาระดับเอกสารคุณภาพ"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <SortableHead label="ลำดับ" active={sortKey === 'order'} dir={sortDir} onClick={() => toggleSort('order')} />
              <SortableHead label="CODE" active={sortKey === 'code'} dir={sortDir} onClick={() => toggleSort('code')} />
              <SortableHead
                label="ชื่อระดับเอกสารคุณภาพ"
                active={sortKey === 'name'}
                dir={sortDir}
                onClick={() => toggleSort('name')}
              />
              <TableHead className="w-28 pr-4 text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-slate-500">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-slate-500">
                  ไม่พบระดับเอกสารคุณภาพ
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 tabular-nums text-slate-700">{row.order}</TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-slate-800">{row.code}</TableCell>
                  <TableCell className="text-slate-800">{row.name}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="icon-sm"
                        className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                        aria-label={`แก้ไข ${row.code}`}
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        className="bg-rose-600 text-white hover:bg-rose-700"
                        aria-label={`ลบ ${row.code}`}
                        onClick={() => setRemoveTarget(row)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          <p>
            กำลังแสดง {from} ถึง {to} จาก {filtered.length.toLocaleString('th-TH')} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              ก่อนหน้า
            </Button>
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-[#2563eb] px-2 font-semibold text-white">
              {safePage}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount}
              onClick={() => setPage(safePage + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </SurfaceCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'แก้ไขระดับเอกสารคุณภาพ' : 'เพิ่มระดับเอกสารคุณภาพ'}</DialogTitle>
            <DialogDescription>CODE จะถูกใช้เป็นส่วนหนึ่งของรหัสเอกสารคุณภาพ</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="quality-level-order">ลำดับ</Label>
              <Input
                id="quality-level-order"
                inputMode="numeric"
                value={form.order}
                onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quality-level-code">CODE</Label>
              <Input
                id="quality-level-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                placeholder="เช่น SAR"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quality-level-name">ชื่อระดับเอกสารคุณภาพ</Label>
              <Input
                id="quality-level-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={busy}>
              {busy ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeTarget != null} onOpenChange={(next) => !next && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบระดับเอกสารคุณภาพ</DialogTitle>
            <DialogDescription>
              ลบ {removeTarget ? `${removeTarget.code} — ${removeTarget.name}` : 'รายการนี้'} ออกจากทะเบียน
              เอกสารที่สร้างไปแล้วจะไม่ถูกลบตาม
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
              ลบรายการ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
        onClick={onClick}
      >
        {label}
        <Icon className={active ? 'size-3.5 text-[#2563eb]' : 'size-3.5 text-slate-300'} />
      </button>
    </TableHead>
  )
}
