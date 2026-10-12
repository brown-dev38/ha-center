'use client'

import { useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useMe } from '@/hooks/use-me'
import { apiFetch } from '@/app/common/api-fetch'
import {
  AppContentCanvas,
  AppMain,
  AppMainInner,
  AppMainInnerWide,
  AppShell,
  AppSidebar,
} from '@/app/common/ui/app-shell'
import { SidebarContent } from '@/app/sidebar-content'
import { TopBar } from '@/app/top-bar'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { usePresenceHeartbeat, logoutPresence } from '@/hooks/use-presence'

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useSession()
  const wasAuthenticated = useRef(false)
  const isProjectorChromeless = pathname?.includes('/session/projector') ?? false
  const isHaV6WideLayout = pathname?.startsWith('/dashboard/documents/ha-v6') ?? false
  const isHscsWideLayout = pathname?.startsWith('/dashboard/hscs') ?? false
  const isPatientExperienceWideLayout =
    pathname?.startsWith('/dashboard/patient-experience') ?? false
  const MainInner =
    isHaV6WideLayout || isHscsWideLayout || isPatientExperienceWideLayout
      ? AppMainInnerWide
      : AppMainInner

  useMe()
  usePresenceHeartbeat()

  if (status === 'authenticated') {
    wasAuthenticated.current = true
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      wasAuthenticated.current = false
      router.replace('/login')
    }
  }, [status, router])

  const handleLogout = async () => {
    try {
      if (FEATURE_FLAGS.presence) await logoutPresence()
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    await signOut({ callbackUrl: '/login' })
  }

  // แสดง spinner เฉพาะโหลดครั้งแรก — ไม่ถอดทั้งจอตอน session refetch (กันหน้าจอพริบ)
  if (status === 'loading' && !wasAuthenticated.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          กำลังตรวจสอบสิทธิ์...
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (isProjectorChromeless) {
    return <>{children}</>
  }

  return (
    <AppShell>
      <AppSidebar>
        <SidebarContent onLogout={handleLogout} />
      </AppSidebar>

      <AppMain className="scrollbar-thin">
        <TopBar onLogout={handleLogout} />
        <MainInner>
          <AppContentCanvas
            className={
              isHaV6WideLayout || isHscsWideLayout || isPatientExperienceWideLayout
                ? 'px-3 py-5 lg:px-5 lg:py-6'
                : undefined
            }
          >
            {children}
          </AppContentCanvas>
        </MainInner>
      </AppMain>
    </AppShell>
  )
}
