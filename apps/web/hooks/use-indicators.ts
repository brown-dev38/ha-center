'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'

type UseIndicatorsParams = {
  departmentId?: string
  categoryId?: string
  isActive?: string
}

export function useIndicators(params: UseIndicatorsParams = {}) {
  return useQuery({
    queryKey: ['indicators', params],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (params.departmentId) q.set('departmentId', params.departmentId)
      if (params.categoryId) q.set('categoryId', params.categoryId)
      q.set('isActive', params.isActive ?? 'true')
      return fetchApiData(`indicators?${q}`)
    },
  })
}

export type IndicatorDashboardData = {
  summary: { total: number; passing: number; failing: number; warning: number }
  byDepartment: Array<{
    department: { id: string; name: string; code: string } | null
    indicators: unknown[]
  }>
}

export function useIndicatorsDashboard() {
  return useQuery({
    queryKey: ['indicators', 'dashboard'],
    queryFn: () => fetchApiData<IndicatorDashboardData>('indicators/dashboard'),
  })
}
