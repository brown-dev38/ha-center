import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import type { NewsItem } from '@/app/news/news'

import { getApiUrl } from '@/app/common/api-url'
import { readApiData } from '@/app/common/parse-api-response'

export type CreateNewsInput = {
  title: string
  slug: string
  content: string
  excerpt?: string
  categoryId: string
  isPublished?: boolean
}

export type UpdateNewsInput = Partial<CreateNewsInput>


async function parseResponse<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export async function createNews(input: CreateNewsInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/news`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseResponse(response)
}

export async function fetchNewsBySlug(slug: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/news/${encodeURIComponent(slug)}`, {
    headers: apiHeaders(),
  })
  return parseResponse<NewsItem>(response)
}

export async function updateNews(id: string, input: UpdateNewsInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/news/${id}`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseResponse(response)
}
