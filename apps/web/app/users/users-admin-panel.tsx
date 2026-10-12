'use client'

import { useMemo, useState } from 'react'
import {
  Briefcase,
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserFormDialog } from '@/app/users/user-form-dialog'
import { useAdminDepartments, useAdminRoles, useAdminUsers } from '@/hooks/use-users-admin'
import { ROLE_LABELS } from '@/app/common/permissions'
import { useUsersAdminDialogStore } from '@/app/users/users-admin-dialog-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

function formatLastLogin(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return '—'
  }
}

export function UsersAdminPanel() {
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined)
  const openCreate = useUsersAdminDialogStore((s) => s.openCreate)
  const openEdit = useUsersAdminDialogStore((s) => s.openEdit)

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      departmentId: departmentId || undefined,
      roleId: roleId || undefined,
      isActive: activeOnly,
    }),
    [search, departmentId, roleId, activeOnly]
  )

  const { data: users, isLoading, isError } = useAdminUsers(filters)
  const { data: roles } = useAdminRoles()
  const { data: departments } = useAdminDepartments()

  const activeCount = (users ?? []).filter((u) => u.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="ค้นหา ชื่อ อีเมล รหัสพนักงาน ตำแหน่ง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="flex h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">ทุกแผนก</option>
            {(departments ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="flex h-10 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">ทุกบทบาท</option>
            {(roles ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {ROLE_LABELS[r.name] ?? r.displayName}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="size-4" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={activeOnly === undefined ? 'default' : 'outline'}
          onClick={() => setActiveOnly(undefined)}
        >
          ทั้งหมด ({users?.length ?? 0})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeOnly === true ? 'default' : 'outline'}
          onClick={() => setActiveOnly(true)}
        >
          <UserCheck className="size-3.5" />
          ใช้งาน ({activeCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeOnly === false ? 'default' : 'outline'}
          onClick={() => setActiveOnly(false)}
        >
          <UserX className="size-3.5" />
          ปิดใช้งาน
        </Button>
      </div>

      {isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          โหลดรายชื่อผู้ใช้ไม่สำเร็จ — ตรวจสอบว่าเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
        </p>
      )}

      <div className={cn(surfaceCardClass(), "overflow-hidden")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ-นามสกุล</TableHead>
              <TableHead>แผนก / ตำแหน่ง</TableHead>
              <TableHead>ติดต่อ</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
              <TableHead className="w-[100px] text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (users?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  ไม่พบผู้ใช้ตามเงื่อนไข
                </TableCell>
              </TableRow>
            )}
            {(users ?? []).map((u) => (
              <TableRow key={u.id} className={cn(!u.isActive && 'opacity-60')}>
                <TableCell>
                  <div className="font-medium">{u.fullName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {u.employeeId && <span>รหัส {u.employeeId}</span>}
                    {u.username && <span>@{u.username}</span>}
                    {!u.isActive && (
                      <Badge variant="outline" className="text-destructive">
                        ปิดใช้งาน
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-1.5 text-sm">
                    <Building2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{u.department ? `${u.department.code} — ${u.department.name}` : '—'}</span>
                  </div>
                  {u.jobTitle && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="size-3 shrink-0" />
                      {u.jobTitle}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="max-w-[180px] truncate">{u.email}</span>
                  </div>
                  {u.phone && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3 shrink-0" />
                      {u.phone}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="size-3" />
                    {ROLE_LABELS[u.role.name] ?? u.role.displayName}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatLastLogin(u.lastLoginAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil className="size-3.5" />
                    แก้ไข
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/[0.03] px-4 py-3 text-xs text-muted-foreground">
        <p className="mb-1 flex items-center gap-2 font-medium text-foreground">
          <Users className="size-3.5 text-primary" />
          ข้อมูลที่ควรกรอกสำหรับผู้ใช้ในระบบ
        </p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>ชื่อ-นามสกุล อีเมล และรหัสผ่าน (หรือ Microsoft SSO ในอนาคต)</li>
          <li>แผนกและตำแหน่ง — ใช้แสดงในรายชื่อผู้เข้าร่วมประชุม</li>
          <li>บทบาท — กำหนดสิทธิ์เข้าถึงเมนูและการแก้ไขข้อมูล</li>
          <li>LINE User ID — สำหรับแจ้งเตือนการประชุม (ถ้ามี)</li>
        </ul>
      </div>

      <UserFormDialog />
    </div>
  )
}
