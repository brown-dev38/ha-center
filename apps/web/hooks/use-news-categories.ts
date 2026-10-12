'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApiData } from '@/app/common/api-json'

export function useNewsCategories() {
  return useQuery({
    queryKey: ['news-categories'],
    queryFn: async () => {
      const data = await fetchApiData<Array<{ id: string; name: string; slug: string }>>(
        'news/categories'
      )
      return Array.isArray(data) ? data : []
    },
  })
}
