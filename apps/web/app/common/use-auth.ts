'use client'

import { useSession } from 'next-auth/react'
import type { AuthUser } from '@/app/common/auth-types'

export function useAuthUser(): AuthUser | null {
  const { data: session } = useSession()
  if (!session?.user?.id) return null

  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    department: session.user.department,
  }
}

export function useAuthStatus() {
  const { status } = useSession()
  return {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
