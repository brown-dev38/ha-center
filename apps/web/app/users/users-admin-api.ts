import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiData } from '@/app/common/parse-api-response'

export type AdminRole = {
  id: string
  name: string
  displayName: string
  description: string | null
}

export type AdminDepartment = {
  id: string
  code: string
  name: string
  nameEn: string | null
  isActive: boolean
  usersCount: number
}

export type AdminUser = {
  id: string
  username: string | null
  email: string
  firstName: string
  lastName: string
  fullName: string
  employeeId: string | null
  jobTitle: string | null
  phone: string | null
  avatarUrl: string | null
  lineUserId: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  role: { id: string; name: string; displayName: string }
  department: { id: string; name: string; code: string } | null
}

export type CreateUserInput = {
  email: string
  username?: string
  password: string
  firstName: string
  lastName: string
  employeeId?: string
  jobTitle?: string
  phone?: string
  lineUserId?: string
  roleId: string
  departmentId?: string
  isActive?: boolean
}

export type UpdateUserInput = {
  email?: string
  username?: string | null
  password?: string
  firstName?: string
  lastName?: string
  employeeId?: string | null
  jobTitle?: string | null
  phone?: string | null
  lineUserId?: string | null
  roleId?: string
  departmentId?: string | null
  isActive?: boolean
}


async function parseJson<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export async function fetchAdminUsers(params?: {
  departmentId?: string
  roleId?: string
  search?: string
  isActive?: boolean
}): Promise<AdminUser[]> {
  const q = new URLSearchParams()
  if (params?.departmentId) q.set('departmentId', params.departmentId)
  if (params?.roleId) q.set('roleId', params.roleId)
  if (params?.search) q.set('search', params.search)
  if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
  const suffix = q.toString() ? `?${q}` : ''
  const response = await apiFetch(`/api/v1/admin/users${suffix}`, {
    headers: apiHeaders(false),
  })
  return parseJson<AdminUser[]>(response)
}

export async function fetchAdminUser(id: string): Promise<AdminUser> {
  const response = await apiFetch(`/api/v1/admin/users/${id}`, {
    headers: apiHeaders(false),
  })
  return parseJson<AdminUser>(response)
}

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const response = await apiFetch(`/api/v1/admin/roles`, {
    headers: apiHeaders(false),
  })
  return parseJson<AdminRole[]>(response)
}

export async function fetchAdminDepartments(): Promise<AdminDepartment[]> {
  const response = await apiFetch(`/api/v1/admin/departments`, {
    headers: apiHeaders(false),
  })
  return parseJson<AdminDepartment[]>(response)
}

export async function createAdminUser(input: CreateUserInput): Promise<AdminUser> {
  const response = await apiFetch(`/api/v1/admin/users`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<AdminUser>(response)
}

export async function updateAdminUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  const response = await apiFetch(`/api/v1/admin/users/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<AdminUser>(response)
}
