'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import {
  Building2,
  KeyRound,
  Mail,
  Shield,
  UserCircle,
} from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useChangePassword, useProfile, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/hooks/use-profile'
import { ROLE_LABELS } from '@/app/common/permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { ProfileAvatarEditor } from '@/app/profile/profile-avatar-editor'

const profileSchema = z.object({
  firstName: z.string().min(1, 'กรุณาระบุชื่อ'),
  lastName: z.string().min(1, 'กรุณาระบุนามสกุล'),
  username: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  lineUserId: z.string().optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(6, 'รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'ยืนยันรหัสผ่านใหม่'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'รหัสผ่านใหม่ไม่ตรงกัน',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

function formatLastLogin(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function ProfilePageContent() {
  const { data: profile, isLoading, isError } = useProfile()
  const updateMutation = useUpdateProfile()
  const passwordMutation = useChangePassword()
  const uploadAvatarMutation = useUploadAvatar()
  const removeAvatarMutation = useRemoveAvatar()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: formResolver(profileSchema),
  })

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PasswordForm>({
    resolver: formResolver(passwordSchema),
  })

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? profile.name.split(' ')[0] ?? '',
        lastName: profile.lastName ?? profile.name.split(' ').slice(1).join(' ') ?? '',
        username: profile.username ?? '',
        jobTitle: profile.jobTitle ?? '',
        phone: profile.phone ?? '',
        lineUserId: profile.lineUserId ?? '',
      })
    }
  }, [profile, reset])

  const onSaveProfile = async (values: ProfileForm) => {
    try {
      await updateMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username?.trim() || undefined,
        jobTitle: values.jobTitle,
        phone: values.phone,
        lineUserId: values.lineUserId,
      })
      showSuccessToast('บันทึกโปรไฟล์แล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const onChangePassword = async (values: PasswordForm) => {
    try {
      await passwordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      showSuccessToast('เปลี่ยนรหัสผ่านแล้ว')
      resetPw()
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
    }
  }

  const onUploadAvatar = async (file: File) => {
    try {
      await uploadAvatarMutation.mutateAsync(file)
      showSuccessToast('อัปเดตรูปโปรไฟล์แล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ')
      throw e
    }
  }

  const onRemoveAvatar = async () => {
    try {
      await removeAvatarMutation.mutateAsync()
      showSuccessToast('ลบรูปโปรไฟล์แล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ลบรูปไม่สำเร็จ')
      throw e
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดโปรไฟล์...
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        โหลดข้อมูลโปรไฟล์ไม่สำเร็จ
      </p>
    )
  }

  const roleLabel = ROLE_LABELS[profile.role] ?? profile.roleDisplayName ?? profile.role

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="profile"
        title="โปรไฟล์ของฉัน"
        description="จัดการข้อมูลส่วนตัว การติดต่อ และรหัสผ่าน (ถ้าเข้าสู่ระบบด้วยบัญชีภายใน)"
      />

      <section className={cn(surfaceCardClass(), "overflow-hidden")}>
        <div className="flex flex-col gap-5 border-b border-border/60 bg-gradient-to-r from-primary/5 to-ha-green/5 p-5 sm:flex-row sm:items-center sm:p-6">
          <ProfileAvatarEditor
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            cacheKey={profile.updatedAt ?? profile.lastLoginAt}
            uploading={uploadAvatarMutation.isPending}
            removing={removeAvatarMutation.isPending}
            onUpload={onUploadAvatar}
            onRemove={profile.avatarUrl ? onRemoveAvatar : undefined}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {profile.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-primary">
                <Shield className="size-3" />
                {roleLabel}
              </Badge>
              {profile.department && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="size-3" />
                  {profile.department.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <InfoRow label="รหัสพนักงาน" value={profile.employeeId} />
          <InfoRow label="เข้าสู่ระบบล่าสุด" value={formatLastLogin(profile.lastLoginAt)} />
        </div>
      </section>

      <form onSubmit={handleSubmit(onSaveProfile)} className={cn(surfaceCardClass(), "space-y-5 p-5 sm:p-6")}>
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <UserCircle className="size-5 text-primary" />
          <h3 className="font-semibold text-foreground">ข้อมูลที่แก้ไขได้</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">ชื่อ</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">นามสกุล</Label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">ชื่อผู้ใช้ (username)</Label>
            <Input id="username" {...register('username')} placeholder="ไม่บังคับ" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">ตำแหน่ง</Label>
            <Input id="jobTitle" {...register('jobTitle')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทร</Label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lineUserId">LINE User ID</Label>
            <Input id="lineUserId" {...register('lineUserId')} placeholder="สำหรับแจ้งเตือน LINE" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          อีเมล แผนก และบทบาทในระบบ — ติดต่อผู้ดูแลระบบหากต้องการเปลี่ยน
        </p>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
          >
            {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
          </Button>
        </div>
      </form>

      <form
        onSubmit={handleSubmitPw(onChangePassword)}
        className={cn(
          cn(surfaceCardClass(), 'space-y-5 p-5 sm:p-6'),
          !profile.canChangePassword && 'opacity-80'
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <KeyRound className="size-5 text-primary" />
          <h3 className="font-semibold text-foreground">เปลี่ยนรหัสผ่าน</h3>
        </div>

        {!profile.canChangePassword ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            บัญชีนี้เข้าสู่ระบบด้วย Microsoft — จัดการรหัสผ่านได้ที่บัญชี Microsoft ของคุณ
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...registerPw('currentPassword')}
                />
                {pwErrors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {pwErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerPw('newPassword')}
                />
                {pwErrors.newPassword && (
                  <p className="text-xs text-destructive">{pwErrors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerPw('confirmPassword')}
                />
                {pwErrors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {pwErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                disabled={pwSubmitting || passwordMutation.isPending}
              >
                {passwordMutation.isPending ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value?.trim() || '—'}</p>
    </div>
  )
}
