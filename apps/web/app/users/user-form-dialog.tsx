'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminDepartments, useAdminRoles } from '@/hooks/use-users-admin'
import {
  createAdminUser,
  updateAdminUser,
  type AdminUser,
  type CreateUserInput,
} from '@/app/users/users-admin-api'
import { ROLE_LABELS } from '@/app/common/permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { useUsersAdminDialogStore } from '@/app/users/users-admin-dialog-store'
import { useQueryClient } from '@tanstack/react-query'

const baseSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  username: z.string().optional(),
  password: z.string().optional(),
  firstName: z.string().min(1, 'กรุณาระบุชื่อ'),
  lastName: z.string().min(1, 'กรุณาระบุนามสกุล'),
  employeeId: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  lineUserId: z.string().optional(),
  roleId: z.string().min(1, 'เลือกบทบาท'),
  departmentId: z.string().optional(),
  isActive: z.boolean(),
})



const createSchema = baseSchema.extend({
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
})

const editSchema = baseSchema

type UserForm = z.infer<typeof baseSchema>

export function UserFormDialog() {
  const createOpen = useUsersAdminDialogStore((s) => s.createOpen)
  const editUser = useUsersAdminDialogStore((s) => s.editUser)
  const close = useUsersAdminDialogStore((s) => s.close)
  const open = createOpen || !!editUser
  const initial = editUser ?? undefined
  const isEdit = !!initial
  const queryClient = useQueryClient()
  const { data: roles } = useAdminRoles()
  const { data: departments } = useAdminDepartments()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: formResolver(isEdit ? editSchema : createSchema),
    values: initial
      ? {
          email: initial.email,
          username: initial.username ?? '',
          password: '',
          firstName: initial.firstName,
          lastName: initial.lastName,
          employeeId: initial.employeeId ?? '',
          jobTitle: initial.jobTitle ?? '',
          phone: initial.phone ?? '',
          lineUserId: initial.lineUserId ?? '',
          roleId: initial.role.id,
          departmentId: initial.department?.id ?? '',
          isActive: initial.isActive,
        }
      : undefined,
    defaultValues: {
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      employeeId: '',
      jobTitle: '',
      phone: '',
      lineUserId: '',
      roleId: '',
      departmentId: '',
      isActive: true,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: UserForm) => {
      const departmentId = values.departmentId?.trim() || undefined
      if (isEdit && initial) {
        const input = {
          email: values.email,
          username: values.username?.trim() || null,
          firstName: values.firstName,
          lastName: values.lastName,
          employeeId: values.employeeId?.trim() || null,
          jobTitle: values.jobTitle?.trim() || null,
          phone: values.phone?.trim() || null,
          lineUserId: values.lineUserId?.trim() || null,
          roleId: values.roleId,
          departmentId: departmentId ?? null,
          isActive: values.isActive,
          ...(values.password?.trim() ? { password: values.password.trim() } : {}),
        }
        return updateAdminUser(initial.id, input)
      }
      const payload: CreateUserInput = {
        email: values.email,
        username: values.username?.trim() || undefined,
        password: values.password!.trim(),
        firstName: values.firstName,
        lastName: values.lastName,
        employeeId: values.employeeId?.trim() || undefined,
        jobTitle: values.jobTitle?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        lineUserId: values.lineUserId?.trim() || undefined,
        roleId: values.roleId,
        departmentId,
        isActive: values.isActive,
      }
      return createAdminUser(payload)
    },
    onSuccess: () => {
      showSuccessToast(isEdit ? 'บันทึกผู้ใช้แล้ว' : 'เพิ่มผู้ใช้แล้ว')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      close()
      reset()
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
    },
  })

  const busy = isSubmitting || mutation.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลบัญชี แผนก ตำแหน่ง และสิทธิ์การใช้งานระบบ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-first">ชื่อ</Label>
              <Input id="u-first" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-last">นามสกุล</Label>
              <Input id="u-last" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-email">อีเมล (เข้าสู่ระบบ)</Label>
              <Input id="u-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-user">ชื่อผู้ใช้ (ไม่บังคับ)</Label>
              <Input id="u-user" {...register('username')} placeholder="admin" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-pass">
              {isEdit ? 'รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่านเริ่มต้น'}
            </Label>
            <Input id="u-pass" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-emp">รหัสพนักงาน</Label>
              <Input id="u-emp" {...register('employeeId')} placeholder="HA001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-job">ตำแหน่ง</Label>
              <Input id="u-job" {...register('jobTitle')} placeholder="นักวิชาการคุณภาพ" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-dept">แผนก / หน่วยงาน</Label>
              <select
                id="u-dept"
                {...register('departmentId')}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— ไม่ระบุ —</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-role">บทบาทระบบ</Label>
              <select
                id="u-role"
                {...register('roleId')}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">เลือกบทบาท</option>
                {(roles ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {ROLE_LABELS[r.name] ?? r.displayName}
                  </option>
                ))}
              </select>
              {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-phone">เบอร์โทร</Label>
              <Input id="u-phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-line">LINE User ID (แจ้งเตือน)</Label>
              <Input id="u-line" {...register('lineUserId')} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5">
            <input type="checkbox" className="size-4" {...register('isActive')} />
            <span className="text-sm">เปิดใช้งานบัญชี (ปิด = ไม่สามารถเข้าสู่ระบบ)</span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
