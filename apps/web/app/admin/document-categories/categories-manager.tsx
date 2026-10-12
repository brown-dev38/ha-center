'use client'

import { useState } from 'react'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminPageShell } from '@/app/admin/admin-page-shell'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
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
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-admin'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

export function CategoriesManagerPage() {
  const { data, isLoading } = useAdminCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', sortOrder: '0' })

  const resetForm = () => {
    setForm({ code: '', name: '', description: '', sortOrder: '0' })
    setEditId(null)
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (row: {
    id: string
    code: string
    name: string
    description: string | null
    sortOrder: number
  }) => {
    setEditId(row.id)
    setForm({
      code: row.code,
      name: row.name,
      description: row.description ?? '',
      sortOrder: String(row.sortOrder),
    })
    setOpen(true)
  }

  const handleSave = async () => {
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    }
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload, description: form.description || null })
        showSuccessToast('อัปเดตหมวดหมู่แล้ว')
      } else {
        await createMutation.mutateAsync(payload)
        showSuccessToast('เพิ่มหมวดหมู่แล้ว')
      }
      setOpen(false)
      resetForm()
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, isActive: !isActive })
      showSuccessToast(isActive ? 'ปิดหมวดหมู่แล้ว' : 'เปิดหมวดหมู่แล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ลบหมวดหมู่ "${name}"?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      showSuccessToast('ลบหมวดหมู่แล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <AdminPageShell
      pageKey="admin-categories"
      title="หมวดหมู่เอกสาร"
      description="จัดการหมวดหมู่เอกสารมาตรฐาน HA — รหัส ชื่อ ลำดับ และสถานะ"
      icon={FolderTree}
    >
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          เพิ่มหมวดหมู่
        </Button>
      </div>

      <SurfaceCard className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ลำดับ</TableHead>
              <TableHead>รหัส</TableHead>
              <TableHead>ชื่อหมวด</TableHead>
              <TableHead>เอกสาร</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>กำลังโหลด...</TableCell>
              </TableRow>
            ) : (
              (data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums">{row.sortOrder}</TableCell>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    {row.description && (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    )}
                  </TableCell>
                  <TableCell>{row.documentCount}</TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? 'secondary' : 'outline'}>
                      {row.isActive ? 'ใช้งาน' : 'ปิด'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleToggle(row.id, row.isActive)}
                      >
                        {row.isActive ? 'ปิด' : 'เปิด'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => void handleDelete(row.id, row.name)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SurfaceCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>รหัสหมวด</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อหมวด</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>คำอธิบาย</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ลำดับแสดงผล</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={() => void handleSave()}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
