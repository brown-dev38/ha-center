'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CqiListItem } from '@/app/cqi/cqi'
import {
  type CqiFormValues,
  createCqiProject,
  deleteCqiProject,
  fetchCqiDepartments,
  fetchCqiDepartmentsSummary,
  fetchCqiDetail,
  fetchCqiOutstanding,
  updateCqiProject,
} from '@/app/cqi/cqi-api'
import { fetchApiList } from '@/app/common/api-json'

type UseCQIParams = {
  departmentId?: string
  year?: number
  status?: string
  isOutstanding?: string
  search?: string
  page?: number
  limit?: number
}

export function useCQI(params: UseCQIParams = {}) {
  return useQuery({
    queryKey: ['cqi', 'list', params],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (params.departmentId) q.set('departmentId', params.departmentId)
      if (params.year != null) q.set('year', String(params.year))
      if (params.status) q.set('status', params.status)
      if (params.isOutstanding) q.set('isOutstanding', params.isOutstanding)
      if (params.search) q.set('search', params.search)
      q.set('page', String(params.page ?? 1))
      q.set('limit', String(params.limit ?? 50))
      return fetchApiList<CqiListItem, { page: number; limit: number; total: number; totalPages: number }>(
        `cqi?${q}`
      )
    },
  })
}

export function useCqiDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['cqi', 'detail', id],
    queryFn: () => fetchCqiDetail(id!),
    enabled: Boolean(id?.trim()),
  })
}

export function useCqiDepartmentsSummary() {
  return useQuery({
    queryKey: ['cqi', 'departments-summary'],
    queryFn: fetchCqiDepartmentsSummary,
  })
}

export function useCQIOutstanding() {
  return useQuery({
    queryKey: ['cqi', 'outstanding'],
    queryFn: fetchCqiOutstanding,
  })
}

export function useCqiDepartmentOptions(enabled = true) {
  return useQuery({
    queryKey: ['cqi', 'department-options'],
    queryFn: fetchCqiDepartments,
    enabled,
    staleTime: 60_000,
  })
}

function useInvalidateCqi() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['cqi'] })
}

export function useCreateCqiProject() {
  const invalidate = useInvalidateCqi()
  return useMutation({
    mutationFn: (values: CqiFormValues) => createCqiProject(values),
    onSuccess: invalidate,
  })
}

export function useUpdateCqiProject(id: string) {
  const invalidate = useInvalidateCqi()
  return useMutation({
    mutationFn: (values: CqiFormValues) => updateCqiProject(id, values),
    onSuccess: invalidate,
  })
}

export function useDeleteCqiProject() {
  const invalidate = useInvalidateCqi()
  return useMutation({
    mutationFn: (id: string) => deleteCqiProject(id),
    onSuccess: invalidate,
  })
}
