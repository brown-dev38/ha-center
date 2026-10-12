'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'

/** ป้องกันหน้าเฉพาะผู้ดูแลระบบ — เด้งกลับแดชบอร์ดถ้าไม่ใช่ admin */
export function AdminGuard({ children }: { children: ReactNode }) {
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

  return <>{children}</>
}
