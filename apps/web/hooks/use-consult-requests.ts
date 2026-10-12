'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/app/common/api-fetch'
import { getApiUrl } from '@/app/common/api-url'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiJson } from '@/app/common/parse-api-response'
import { fetchApiData } from '@/app/common/api-json'

export type ConsultRequest = {
  id: string
  topic: string
  department: string
  name: string
  email: string
  phone: string | null
  urgent: boolean
  message: string
  status: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export type ConsultSubmitInput = {
  topic: string
  department: string
  name: string
  email: string
  phone?: string
  urgent: boolean
  message: string
}


export function useSubmitConsult() {
  return useMutation({
    mutationFn: async (input: ConsultSubmitInput) => {
      const res = await apiFetch(`${getApiUrl()}/api/v1/contact`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(input),
      })
      const json = await readApiJson<{ success: boolean; message?: string; error?: string }>(res)
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? json.message ?? 'ส่งคำขอไม่สำเร็จ')
      }
      return json
    },
  })
}

export function useConsultRequests(status?: string) {
  return useQuery({
    queryKey: ['consult-requests', status ?? 'all'],
    queryFn: () =>
      fetchApiData<{ requests: ConsultRequest[]; summary: Record<string, number> }>(
        `contact${status ? `?status=${status}` : ''}`
      ),
  })
}

export function useUpdateConsultRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string
      status?: string
      note?: string
    }) => {
      const res = await apiFetch(`${getApiUrl()}/api/v1/contact/${id}`, {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ status, note }),
      })
      const json = await readApiJson<{ success: boolean; message?: string; error?: string }>(res)
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? json.message ?? 'อัปเดตไม่สำเร็จ')
      }
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consult-requests'] }),
  })
}
