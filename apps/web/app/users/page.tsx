'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { UsersAdminPanel } from '@/app/users/users-admin-panel'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/app/common/utils'

export default function UsersAdminPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = usePermissions()

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.replace('/dashboard')
    }
  }, [isLoading, isAdmin, router])

  if (isLoading || !isAdmin()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        กำลังตรวจสอบสิทธิ์...
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="users"
        title="จัดการผู้ใช้งาน"
        description="เพิ่ม แก้ไข และกำหนดสิทธิ์ผู้ใช้ในระบบศูนย์ HA — แผนก ตำแหน่ง และบทบาท"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="size-5" />
        </div>
      </AdminEditablePageHeader>

      <UsersAdminPanel />
    </div>
  )
}
