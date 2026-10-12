import { apiFetch } from '@/app/common/api-fetch'
import { getApiUrl } from '@/app/common/api-url'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiData, readApiJson } from '@/app/common/parse-api-response'

export type UserProfile = {
  id: string
  username: string | null
  name: string
  firstName?: string
  lastName?: string
  email: string
  role: string
  roleDisplayName?: string
  department: { id: string; code: string; name: string } | null
  employeeId?: string | null
  jobTitle?: string | null
  phone?: string | null
  lineUserId?: string | null
  avatarUrl?: string | null
  lastLoginAt?: string | null
  updatedAt?: string | null
  canChangePassword?: boolean
  permissions: string[]
}

export type UpdateProfileInput = {
  firstName?: string
  lastName?: string
  username?: string
  jobTitle?: string
  phone?: string
  lineUserId?: string
}


async function parseJson<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const response = await apiFetch(`${getApiUrl()}/api/v1/auth/me`, {
    headers: apiHeaders(false),
  })
  return parseJson<UserProfile>(response)
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await apiFetch(`${getApiUrl()}/api/v1/auth/me`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<UserProfile>(response)
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/auth/me/password`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  await readApiJson(response)
  return { success: true as const }
}

export async function uploadMyAvatar(file: File): Promise<UserProfile> {
  const form = new FormData()
  form.append('avatar', file)

  const response = await apiFetch(`${getApiUrl()}/api/v1/auth/me/avatar`, {
    method: 'POST',
    headers: apiHeaders(false),
    body: form,
  })
  return parseJson<UserProfile>(response)
}

export async function removeMyAvatar(): Promise<UserProfile> {
  const response = await apiFetch(`${getApiUrl()}/api/v1/auth/me/avatar`, {
    method: 'DELETE',
    headers: apiHeaders(false),
  })
  return parseJson<UserProfile>(response)
}
