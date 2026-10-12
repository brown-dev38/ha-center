import { fetchApiData } from '@/app/common/api-json'
import type { HaV6DocStatus, HaV6StorageItem } from '@/app/documents/ha-v6-tracker-types'

export type HaV6ServerState = {
  documentId: string
  status: HaV6DocStatus
  progressPercent: number
  storageItems: HaV6StorageItem[]
  remarks: string
  updatedAt: string
  updatedById: string | null
}

export type HaV6TrackerStatesMap = Record<string, HaV6ServerState>

export async function fetchHaV6TrackerStates() {
  return fetchApiData<HaV6TrackerStatesMap>('documents/ha-v6-tracker')
}

export async function patchHaV6DocumentState(input: {
  documentId: string
  status?: HaV6DocStatus
  progressPercent?: number
  storageItems?: HaV6StorageItem[]
  remarks?: string
}) {
  return fetchApiData<HaV6ServerState>('documents/ha-v6-tracker', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function migrateHaV6LocalStates(
  states: Array<{
    documentId: string
    status?: HaV6DocStatus
    progressPercent?: number
    storageItems?: HaV6StorageItem[]
    remarks?: string
  }>
) {
  return fetchApiData<HaV6TrackerStatesMap>('documents/ha-v6-tracker', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ migrate: true, states }),
  })
}

export async function uploadHaV6TrackerFile(documentId: string, file: File) {
  const form = new FormData()
  form.append('documentId', documentId)
  form.append('file', file)
  return fetchApiData<{
    id: string
    kind: 'file'
    fileId: string
    fileName: string
    mimeType: string
    fileSize: number
    addedAt: string
  }>('documents/ha-v6-files', {
    method: 'POST',
    body: form,
  })
}

export function haV6FileDownloadPath(fileId: string) {
  return `/documents/api/ha-v6-files/${encodeURIComponent(fileId)}`
}

export async function deleteHaV6TrackerFile(fileId: string) {
  return fetchApiData<{ success: boolean }>(
    `documents/ha-v6-files/${encodeURIComponent(fileId)}`,
    { method: 'DELETE' }
  )
}
