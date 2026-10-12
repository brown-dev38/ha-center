import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { getPermissions } from '@/app/common/server/permissions'
import { getSessionAuthUser } from '@/app/common/server/session-auth'

export type AuthenticatedUser = {
  id: string
  email: string
  role: string
  roleLabel: string
  departmentId: string | null
  departmentName: string | null
  firstName: string
  lastName: string
  avatarUrl: string | null
}

const API_JSON_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'X-HA-API': 'web-native',
} as const

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json(
    message ? { success: true, data, message } : { success: true, data },
    { headers: API_JSON_HEADERS }
  )
}

export function errorResponse(status: number, error: string, code: string) {
  return NextResponse.json(
    { success: false, error, code },
    { status, headers: API_JSON_HEADERS }
  )
}

export function getBearerToken(_request: NextRequest): string | null {
  return null
}

export async function requireAuthUser(_request: NextRequest): Promise<{
  token: { sub: string; role: string }
  user: AuthenticatedUser
} | null> {
  const user = await getSessionAuthUser()
  if (!user) return null

  return {
    token: { sub: user.id, role: user.role },
    user,
  }
}

export function mapMeProfile(user: {
  id: string
  username: string | null
  email: string
  firstName: string
  lastName: string
  employeeId: string | null
  jobTitle: string | null
  phone: string | null
  lineUserId: string | null
  avatarUrl: string | null
  microsoftOid: string | null
  lastLoginAt: Date | null
  updatedAt: Date
  role: { name: string; displayName: string }
  department: { id: string; code: string; name: string } | null
}) {
  return {
    id: user.id,
    username: user.username,
    name: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role.name,
    roleDisplayName: user.role.displayName,
    department: user.department ? { id: user.department.id, code: user.department.code, name: user.department.name } : null,
    employeeId: user.employeeId,
    jobTitle: user.jobTitle,
    phone: user.phone,
    lineUserId: user.lineUserId,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    updatedAt: user.updatedAt.toISOString(),
    canChangePassword: !user.microsoftOid,
    permissions: getPermissions(user.role.name),
  }
}

