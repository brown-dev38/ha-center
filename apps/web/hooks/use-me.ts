'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { fetchApiData } from '@/app/common/api-json'
import { CLIENT_POLLING } from '@/app/common/client-polling'

export function useMe() {
  const { data: session, status } = useSession()

  return useQuery({
    queryKey: ['me', session?.user?.id],
    enabled: status === 'authenticated',
    staleTime: CLIENT_POLLING.meStaleMs,
    queryFn: () =>
      fetchApiData<{
        id: string
        username: string | null
        name: string
        email: string
        role: string
        department: { id: string; code: string; name: string } | null
        permissions: string[]
        avatarUrl?: string | null
        updatedAt?: string | null
        lastLoginAt?: string | null
      }>('auth/me'),
  })
}
