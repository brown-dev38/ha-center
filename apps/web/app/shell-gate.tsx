'use client'

import { usePathname } from 'next/navigation'
import AppShellLayout from '@/app/app-shell-layout'

function isPublicRoute(pathname: string | null) {
  if (!pathname || pathname === '/') return true
  return pathname.startsWith('/login') || pathname.startsWith('/auth')
}

export function ShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (isPublicRoute(pathname)) return <>{children}</>
  return <AppShellLayout>{children}</AppShellLayout>
}


