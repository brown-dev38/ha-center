import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import type { KmInnovationItem, KmResultItem, KmResultType, KmSessionDetail, KmSessionItem } from '@/app/km/km'
import { readApiData, readApiJson } from '@/app/common/parse-api-response'

import { getApiUrl } from '@/app/common/api-url'


async function parseResponse<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export type CreateKmSessionInput = {
  title: string
  sessionDate: string
  fiscalYear: number
  facilitatorId: string
  description?: string
  location?: string
  status?: string
  file?: File
  fileUrl?: string
}

export type CreateKmResultInput = {
  sessionId: string
  type: KmResultType
  title: string
  description?: string
  systemUrl?: string
  imageUrl?: string
}

export type CreateKmInnovationInput = {
  sessionId?: string
  title: string
  description: string
  innovationType?: string
  result?: string
  year?: number
}

export async function createKmSession(input: CreateKmSessionInput) {
  const form = new FormData()
  form.append('title', input.title)
  form.append('sessionDate', input.sessionDate)
  form.append('fiscalYear', String(input.fiscalYear))
  form.append('facilitatorId', input.facilitatorId)
  if (input.file) form.append('file', input.file)
  if (input.fileUrl?.trim()) form.append('fileUrl', input.fileUrl.trim())

  const response = await apiFetch(`${getApiUrl()}/api/v1/km/sessions`, {
    method: 'POST',
    headers: apiHeaders(),
    body: form,
  })
  return parseResponse<KmSessionItem>(response)
}

export async function createKmResult(input: CreateKmResultInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/km/results`, {
    method: 'POST',
    headers: apiHeaders(true),
    body: JSON.stringify(input),
  })
  return parseResponse(response)
}

export async function createKmInnovation(input: CreateKmInnovationInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/km/innovations`, {
    method: 'POST',
    headers: apiHeaders(true),
    body: JSON.stringify(input),
  })
  return parseResponse(response)
}

export async function openKmReportPdf(sessionId: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/km/sessions/${sessionId}/report`, {
    headers: apiHeaders(),
  })
  if (!response.ok) {
    try {
      const json = await readApiJson<{ error?: string }>(response)
      throw new Error(json.error ?? 'เปิดไฟล์รายงานไม่สำเร็จ')
    } catch (e) {
      throw e instanceof Error ? e : new Error('เปิดไฟล์รายงานไม่สำเร็จ')
    }
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function fetchKmSessionDetail(id: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/km/sessions/${id}`, {
    headers: apiHeaders(),
  })
  return parseResponse<KmSessionDetail>(response)
}
