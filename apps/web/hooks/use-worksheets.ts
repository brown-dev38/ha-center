'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'
import type { UnitProfileWorksheet } from '@/app/service-profile/worksheet-types'
import type { WorksheetListItem } from '@/app/service-profile/server/worksheets'

export type WorksheetDetail = {
  id: string
  departmentId: string
  department: { id: string; name: string; code: string }
  year: number
  title: string
  status: string
  formData: UnitProfileWorksheet
  preparedBy: { id: string; name: string }
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  canEdit?: boolean
  versions?: { id: string; versionNo: number; generatedAt: string }[]
}

export function useWorksheets(filters?: { status?: string; year?: number; includeHidden?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.year) params.set('year', String(filters.year))
  if (filters?.includeHidden) params.set('includeHidden', 'true')
  const qs = params.toString()

  return useQuery({
    queryKey: ['worksheets', filters],
    queryFn: () => fetchApiData<WorksheetListItem[]>(`service-profile/worksheets${qs ? `?${qs}` : ''}`),
  })
}

export function useWorksheet(id?: string) {
  return useQuery({
    queryKey: ['worksheets', id],
    enabled: Boolean(id),
    queryFn: () => fetchApiData<WorksheetDetail>(`service-profile/worksheets/${id}`),
  })
}

export function useSaveWorksheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id?: string; formData: UnitProfileWorksheet; departmentId?: string }) => {
      if (input.id) {
        return fetchApiData<WorksheetDetail>(`service-profile/worksheets/${input.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: input.formData }),
        })
      }
      return fetchApiData<WorksheetDetail>('service-profile/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: input.formData, departmentId: input.departmentId }),
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['worksheets'] })
    },
  })
}

export function useSubmitWorksheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; formData: UnitProfileWorksheet }) =>
      fetchApiData<WorksheetDetail>(`service-profile/worksheets/${input.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: input.formData }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['worksheets'] })
    },
  })
}

export function useSetWorksheetHidden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; hidden: boolean }) =>
      fetchApiData<WorksheetDetail>(`service-profile/worksheets/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: input.hidden }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['worksheets'] })
    },
  })
}
