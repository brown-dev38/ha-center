'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData, fetchApiList } from '@/app/common/api-json'
import type { KmInnovationItem, KmResultItem, KmSessionItem } from '@/app/km/km'
import { fetchKmSessionDetail } from '@/app/km/km-api'

type SessionsParams = {
  year?: number
  search?: string
  page?: number
  limit?: number
}

export function useKmSessions(params: SessionsParams = {}) {
  return useQuery({
    queryKey: ['km', 'sessions', params],
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params.year !== undefined) qs.set('year', String(params.year))
      if (params.search) qs.set('search', params.search)
      qs.set('page', String(params.page ?? 1))
      qs.set('limit', String(params.limit ?? 20))

      return fetchApiList<KmSessionItem, { page: number; limit: number; total: number; totalPages: number }>(
        `km/sessions?${qs.toString()}`
      )
    },
  })
}

export function useKmSession(id: string | undefined) {
  return useQuery({
    queryKey: ['km', 'session', id],
    queryFn: () => fetchKmSessionDetail(id!),
    enabled: Boolean(id?.trim()),
  })
}

export function useKmResults(params: { type?: 'system' | 'innovation'; sessionId?: string; year?: number } = {}) {
  return useQuery({
    queryKey: ['km', 'results', params],
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params.type) qs.set('type', params.type)
      if (params.sessionId) qs.set('sessionId', params.sessionId)
      if (params.year !== undefined) qs.set('year', String(params.year))
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return fetchApiData<KmResultItem[]>(`km/results${suffix}`)
    },
  })
}

export function useKmInnovations(params: { year?: number; sessionId?: string } = {}) {
  return useQuery({
    queryKey: ['km', 'innovations', params],
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params.year !== undefined) qs.set('year', String(params.year))
      if (params.sessionId) qs.set('sessionId', params.sessionId)
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      return fetchApiData<KmInnovationItem[]>(`km/innovations${suffix}`)
    },
  })
}
