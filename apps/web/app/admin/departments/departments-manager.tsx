'use client'

import { useState } from 'react'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
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
  useAdminDepartments,
  useCreateDepartment,
  useDeleteDepartment,
  useUpdateDepartment,
} from '@/hooks/use-admin'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

export function DepartmentsManagerPage() {
  const { data, isLoading } = useAdminDepartments()
  const createMutation = useCreateDepartment()
  const updateMutation = useUpdateDepartment()
  const deleteMutation = useDeleteDepartment()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', nameEn: '' })

  const resetForm = () => {
    setForm({ code: '', name: '', nameEn: '' })
    setEditId(null)
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (row: { id: string; code: string; name: string; nameEn: string | null }) => {
    setEditId(row.id)
    setForm({ code: row.code, name: row.name, nameEn: row.nameEn ?? '' })
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editId) {
        await updateMutation.mutateAsync({
          id: editId,
          code: form.code,
          name: form.name,
          nameEn: form.nameEn || null,
        })
        showSuccessToast('อัปเดตแผนกแล้ว')
      } else {
        await createMutation.mutateAsync(form)
        showSuccessToast('เพิ่มแผนกแล้ว')
      }
      setOpen(false)
      resetForm()
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, isActive: !isActive })
      showSuccessToast(isActive ? 'ปิดใช้งานแผนกแล้ว' : 'เปิดใช้งานแผนกแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ลบแผนก "${name}"?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      showSuccessToast('ลบแผนกแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <AdminPageShell
      pageKey="admin-departments"
      title="จัดการแผนก"
      description="เพิ่ม แก้ไข เปิด/ปิดใช้งานแผนกในระบบ"
      icon={Building2}
    >
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          เพิ่มแผนก
        </Button>
      </div>

      <SurfaceCard className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัส</TableHead>
              <TableHead>ชื่อแผนก</TableHead>
              <TableHead>ชื่อ (EN)</TableHead>
              <TableHead>ผู้ใช้</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : (
              (data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.nameEn ?? '—'}</TableCell>
                  <TableCell>{row.usersCount}</TableCell>
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
                        onClick={() => void handleToggleActive(row.id, row.isActive)}
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
            <DialogTitle>{editId ? 'แก้ไขแผนก' : 'เพิ่มแผนก'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>รหัสแผนก</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อแผนก</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อภาษาอังกฤษ</Label>
              <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
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
