'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminPageShell } from '@/app/admin/admin-page-shell'
import {
  createQualityUnit,
  deleteQualityUnit,
  fetchAdminQualityUnits,
  updateQualityUnit,
  type QualityDocumentUnit,
} from '@/app/admin/admin-api'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { QUALITY_UNIT_GROUPS } from '@/app/documents/document-quality-units'
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
import { cn } from '@/app/common/utils'

const PAGE_SIZE = 10

type SortKey = 'order' | 'code' | 'name' | 'group'
type UnitForm = { order: string; code: string; name: string; group: string }

const emptyForm = (): UnitForm => ({ order: '', code: '', name: '', group: 'หน่วยงาน' })

function SortMark({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-slate-300" />
  return dir === 'asc' ? (
    <ArrowUp className="size-3.5 text-sky-600" />
  ) : (
    <ArrowDown className="size-3.5 text-sky-600" />
  )
}

export function QualityUnitsManagerPage() {
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'quality-units'] })
    queryClient.invalidateQueries({ queryKey: ['documents', 'departments'] })
  }
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'quality-units'],
    queryFn: fetchAdminQualityUnits,
  })
  const createMutation = useMutation({ mutationFn: createQualityUnit, onSuccess: refresh })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string
      order?: number
      code?: string
      name?: string
      group?: string
    }) => updateQualityUnit(id, input),
    onSuccess: refresh,
  })
  const deleteMutation = useMutation({ mutationFn: deleteQualityUnit, onSuccess: refresh })
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('order')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<UnitForm>(emptyForm)
  const [removeTarget, setRemoveTarget] = useState<QualityDocumentUnit | null>(null)

  const rows = data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q
      ? rows.filter(
          (row) =>
            row.code.toLowerCase().includes(q) ||
            row.name.toLowerCase().includes(q) ||
            (row.group ?? '').toLowerCase().includes(q)
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
  const nextOrder = rows.reduce((max, row) => Math.max(max, row.order), 0) + 1
  const saving = createMutation.isPending || updateMutation.isPending

  const toggleSort = (key: SortKey) => {
    setPage(1)
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm(), order: String(nextOrder) })
    setOpen(true)
  }

  const openEdit = (row: QualityDocumentUnit) => {
    setEditId(row.id)
    setForm({
      order: String(row.order),
      code: row.code,
      name: row.name,
      group: row.group,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    const order = Number(form.order)
    const payload = {
      order: Number.isFinite(order) ? order : undefined,
      code: form.code,
      name: form.name,
      group: form.group,
    }
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload })
        showSuccessToast('แก้ไขหน่วยงาน/ทีมแล้ว')
      } else {
        await createMutation.mutateAsync({
          ...payload,
          code: form.code,
          name: form.name,
          group: form.group,
        })
        showSuccessToast('เพิ่มหน่วยงาน/ทีมแล้ว')
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
      showSuccessToast('ลบหน่วยงาน/ทีมแล้ว')
      setRemoveTarget(null)
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'ลบไม่สำเร็จ')
    }
  }

  const headers = [
    ['order', 'ลำดับ', 'w-24'],
    ['code', 'CODE', 'w-28'],
    ['name', 'ชื่อหน่วยงาน/ทีม', ''],
    ['group', 'กลุ่ม', 'w-44'],
  ] as const

  return (
    <AdminPageShell
      pageKey="admin-quality-units"
      title="หน่วยงาน/ทีม"
      description="แสดงหน่วยงาน/ทีมทั้งหมดที่ใช้กับเอกสารคุณภาพ"
      icon={Building2}
    >
      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">แสดงหน่วยงาน/ทีมทั้งหมด</p>
            <Button
              type="button"
              className="mt-3 h-9 gap-1.5 bg-[#17a2b8] px-3 text-white shadow-none hover:bg-[#138496]"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              เพิ่มหน่วยงาน/ทีม
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            ค้นหา:
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="h-9 w-56"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                {headers.map(([key, label, width]) => (
                  <th key={key} className={cn('px-3 py-2 font-medium', width)}>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(key)}>
                      {label}
                      <SortMark active={sortKey === key} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="w-28 px-3 py-2 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                    ไม่พบหน่วยงาน/ทีม
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-slate-600">{row.order}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{row.code}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.group}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          size="icon-sm"
                          className="bg-[#17a2b8] text-white hover:bg-[#138496]"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          <p>
            กำลังแสดง {from.toLocaleString('th-TH')} ถึง {to.toLocaleString('th-TH')} จาก{' '}
            {filtered.length.toLocaleString('th-TH')} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              ก่อนหน้า
            </Button>
            <span>
              {safePage.toLocaleString('th-TH')} / {pageCount.toLocaleString('th-TH')}
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
            <DialogTitle>{editId ? 'แก้ไขหน่วยงาน/ทีม' : 'เพิ่มหน่วยงาน/ทีม'}</DialogTitle>
            <DialogDescription>ใช้ CODE นี้ตอนสร้างรหัสเอกสารคุณภาพ</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unit-order">ลำดับ</Label>
              <Input
                id="unit-order"
                inputMode="numeric"
                value={form.order}
                onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-code">CODE</Label>
              <Input
                id="unit-code"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-name">ชื่อหน่วยงาน/ทีม</Label>
              <Input
                id="unit-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit-group">กลุ่ม</Label>
              <select
                id="unit-group"
                value={form.group}
                onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {QUALITY_UNIT_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-[#17a2b8] hover:bg-[#138496]"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={(next) => !next && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบหน่วยงาน/ทีม</DialogTitle>
            <DialogDescription>
              นำ {removeTarget?.code} — {removeTarget?.name} ออกจากรายการ
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
