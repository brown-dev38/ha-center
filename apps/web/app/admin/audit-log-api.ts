import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiData } from '@/app/common/parse-api-response'

export type AuditLogUser = {
  id: string
  name: string
  email: string
  role: string | null
  departmentName: string | null
}

export type AuditLogItem = {
  id: string
  action: string
  entity: string
  entityId: string | null
  oldData: unknown
  newData: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: AuditLogUser | null
}

export type AuditLogListResponse = {
  data: AuditLogItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type AuditLogStatsResponse = {
  total: number
  days: number
  byAction: Array<{ action: string; count: number }>
  byEntity: Array<{ entity: string; count: number }>
  byDay: Array<{ day: string; count: number }>
  topUsers: Array<{ userId: string; name: string; count: number }>
}

export type AuditLogQuery = {
  page?: number
  limit?: number
  entity?: string
  action?: string
  userId?: string
  search?: string
  from?: string
  to?: string
}


async function parseJson<T>(res: Response): Promise<T> {
  return readApiData<T>(res)
}

export async function fetchAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogListResponse> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const res = await apiFetch(
    `/api/v1/admin/audit-logs${params.toString() ? `?${params}` : ''}`,
    { headers: apiHeaders() }
  )
  return parseJson(res)
}

export async function fetchAuditLogStats(days = 7): Promise<AuditLogStatsResponse> {
  const res = await apiFetch(
    `/api/v1/admin/audit-logs/stats?days=${days}`,
    { headers: apiHeaders() }
  )
  return parseJson(res)
}
