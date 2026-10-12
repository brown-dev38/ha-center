'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'
import type { NewsItem } from '@/app/news/news'

type UseNewsParams = {
  published?: boolean
  categoryId?: string
  limit?: number
}

export function useNews(params: UseNewsParams = {}) {
  return useQuery({
    queryKey: ['news', params],
    queryFn: async () => {
      const q = new URLSearchParams()
      if (params.published === true) q.set('published', 'true')
      if (params.categoryId) q.set('categoryId', params.categoryId)
      q.set('limit', String(params.limit ?? 50))
      const suffix = q.toString() ? `?${q}` : ''
      const data = await fetchApiData<NewsItem[]>(`news${suffix}`)
      return Array.isArray(data) ? data : []
    },
  })
}
