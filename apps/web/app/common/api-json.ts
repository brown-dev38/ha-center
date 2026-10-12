import { apiFetch } from '@/app/common/api-fetch'
import { featureApiPath } from '@/app/common/api-path'
import { readApiJson } from '@/app/common/parse-api-response'

type ApiSuccess<T> = { success: true; data: T; message?: string }

/** GET/POST แล้วคืน `data` จาก envelope `{ success, data }` */
export async function fetchApiData<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(featureApiPath(path), init)
  const json = await readApiJson<ApiSuccess<T>>(res)
  return json.data
}

/** คืน JSON ทั้งก้อน (เช่น list ที่มี pagination คู่กับ data) */
export async function fetchApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(featureApiPath(path), init)
  return readApiJson<T>(res)
}

/** คืน `{ data, pagination }` สำหรับ list endpoints */
export async function fetchApiList<TItem, TPagination = Record<string, unknown>>(
  path: string,
  init?: RequestInit
): Promise<{ data: TItem[]; pagination?: TPagination }> {
  const json = await fetchApiJson<{
    success: true
    data: TItem[] | { data: TItem[]; pagination?: TPagination }
    pagination?: TPagination
  }>(path, init)

  let items = json.data
  let pagination = json.pagination

  if (items && typeof items === 'object' && !Array.isArray(items) && 'data' in items) {
    const nested = items as { data: TItem[]; pagination?: TPagination }
    items = nested.data
    pagination = pagination ?? nested.pagination
  }

  if (items && typeof items === 'object' && !Array.isArray(items) && 'success' in items) {
    const nested = items as { success: true; data: TItem[]; pagination?: TPagination}
    items = nested.data
    pagination = pagination ?? nested.pagination
  }

  return {
    data: Array.isArray(items) ? items : [],
    pagination,
  }
}
