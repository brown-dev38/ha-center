'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'

export type DocumentCategory = {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
  documentCount: number
}

function unwrapCategories(
  data: DocumentCategory[] | { data: DocumentCategory[] } | null | undefined
): DocumentCategory[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data
  return []
}

export function useDocumentCategories() {
  return useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const data = await fetchApiData<DocumentCategory[] | { data: DocumentCategory[] }>(
        'documents/categories'
      )
      return unwrapCategories(data)
    },
    staleTime: 0,
    gcTime: 60_000,
    refetchOnMount: 'always',
    retry: 2,
  })
}
