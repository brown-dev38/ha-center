'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'
import { apiFetch } from '@/app/common/api-fetch'
import { getApiUrl } from '@/app/common/api-url'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiJson } from '@/app/common/parse-api-response'

export type RelatedLink = {
  id: string
  title: string
  url: string
  description: string | null
  iconUrl: string | null
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export type RelatedLinkInput = {
  title: string
  url: string
  description: string
  sortOrder: number
}

export function useRelatedLinks() {
  return useQuery({
    queryKey: ['related-links'],
    queryFn: async () => {
      const data = await fetchApiData<RelatedLink[]>('news/links')
      return Array.isArray(data) ? data : []
    },
  })
}


async function mutateLink(url: string, method: string, body?: unknown) {
  const res = await apiFetch(url, {
    method,
    headers: apiHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await readApiJson<{ success: boolean; message?: string; error?: string }>(res)
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? json.message ?? 'ดำเนินการไม่สำเร็จ')
  }
  return json
}

export function useCreateRelatedLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RelatedLinkInput) =>
      mutateLink(`${getApiUrl()}/api/v1/news/links`, 'POST', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['related-links'] }),
  })
}

export function useUpdateRelatedLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RelatedLinkInput }) =>
      mutateLink(`${getApiUrl()}/api/v1/news/links/${id}`, 'PATCH', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['related-links'] }),
  })
}

export function useDeleteRelatedLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mutateLink(`${getApiUrl()}/api/v1/news/links/${id}`, 'DELETE'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['related-links'] }),
  })
}
