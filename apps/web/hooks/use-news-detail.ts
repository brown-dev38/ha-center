'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchNewsBySlug } from '@/app/news/news-api'

export function useNewsDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ['news', 'detail', slug],
    queryFn: () => fetchNewsBySlug(slug!),
    enabled: Boolean(slug?.trim()),
  })
}
