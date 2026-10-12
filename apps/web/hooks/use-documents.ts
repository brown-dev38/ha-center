'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/app/common/api-fetch'
import { readApiJson } from '@/app/common/parse-api-response'
import type { HaDocumentItem } from '@/app/documents/documents'

export type DocumentsListResult = {
  data: HaDocumentItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

type UseDocumentsParams = {
  category?: string
  sectionNo?: string
  search?: string
  page?: number
  limit?: number
  access?: string
  includeHidden?: boolean
  enabled?: boolean
}

export function useDocuments(params: UseDocumentsParams = {}) {
  const { status } = useSession()
  const { enabled = true, ...queryParams } = params

  return useQuery({
    queryKey: ['documents', queryParams, status],
    enabled: status === 'authenticated' && enabled,
    queryFn: async () => {
      const q = new URLSearchParams()
      if (queryParams.category) q.set('category', queryParams.category)
      if (queryParams.sectionNo) q.set('sectionNo', queryParams.sectionNo)
      if (queryParams.search) q.set('search', queryParams.search)
      q.set('page', String(queryParams.page ?? 1))
      q.set('limit', String(queryParams.limit ?? 20))
      if (queryParams.access) q.set('access', queryParams.access)
      if (queryParams.includeHidden) q.set('includeHidden', 'true')

      const res = await apiFetch(`/api/v1/documents?${q}`)
      const json = await readApiJson<{
        success: true
        data: HaDocumentItem[]
        pagination: DocumentsListResult['pagination']
      }>(res)
      return {
        data: Array.isArray(json.data) ? json.data : [],
        pagination: json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
    },
  })
}
