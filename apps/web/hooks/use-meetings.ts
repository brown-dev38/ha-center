'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'

type UseMeetingsParams = {
  month?: number
  year?: number
  status?: string
  type?: string
  roomId?: string
}

export function useMeetings(params: UseMeetingsParams = {}) {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (params.month != null) q.set('month', String(params.month))
      if (params.year != null) q.set('year', String(params.year))
      if (params.status) q.set('status', params.status)
      if (params.type) q.set('type', params.type)
      if (params.roomId) q.set('roomId', params.roomId)
      const suffix = q.toString() ? `?${q}` : ''
      return fetchApiData(`meetings${suffix}`)
    },
  })
}

export function useMeetingsUpcoming() {
  return useQuery({
    queryKey: ['meetings', 'upcoming'],
    queryFn: () => fetchApiData('meetings/upcoming'),
  })
}
