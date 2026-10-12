import { apiFetch } from '@/app/common/api-fetch'
import { getApiUrl } from '@/app/common/api-url'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiData } from '@/app/common/parse-api-response'

export type OnlineUser = {
  userId: string
  name: string
  email: string | null
  role: string | null
  roleLabel: string | null
  departmentName: string | null
  avatarUrl: string | null
  page: string | null
  ipAddress: string | null
  lastSeenAt: string
  loginAt: string
  secondsSinceLastSeen: number
}

export type OnlineListResponse = {
  count: number
  users: OnlineUser[]
}


async function parseJson<T>(res: Response): Promise<T> {
  return readApiData<T>(res)
}

export async function sendHeartbeat(page?: string): Promise<{
  ok: boolean
  onlineCount: number
  lastSeenAt: string
}> {
  const res = await apiFetch(`${getApiUrl()}/api/v1/presence/heartbeat`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ page }),
  })
  return parseJson(res)
}

export async function leavePresence(): Promise<void> {
  try {
    await apiFetch(`${getApiUrl()}/api/v1/presence/leave`, {
      method: 'POST',
      headers: apiHeaders(false),
    })
  } catch {
    /* best effort */
  }
}

export async function fetchOnlineUsers(): Promise<OnlineListResponse> {
  const res = await apiFetch(`${getApiUrl()}/api/v1/presence/online`, {
    headers: apiHeaders(false),
  })
  return parseJson(res)
}
