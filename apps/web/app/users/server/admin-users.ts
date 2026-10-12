import { hash } from 'bcryptjs'
import { prisma } from '@/app/common/server/prisma'
import { writeAuditLog } from '@/app/admin/server/audit'
import type { AuthenticatedUser } from '@/app/auth/server/auth-user'
import { allocateUserId } from '@/app/auth/server/user-id'

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  employeeId: true,
  jobTitle: true,
  phone: true,
  avatarUrl: true,
  lineUserId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, displayName: true } },
  department: { select: { id: true, name: true, code: true } },
} as const

export function formatUserRow(user: {
  id: string
  username: string | null
  email: string
  firstName: string
  lastName: string
  employeeId: string | null
  jobTitle: string | null
  phone: string | null
  avatarUrl: string | null
  lineUserId: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  role: { id: string; name: string; displayName: string }
  department: { id: string; name: string; code: string } | null
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    employeeId: user.employeeId,
    jobTitle: user.jobTitle,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    lineUserId: user.lineUserId,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    role: user.role,
    department: user.department,
  }
}

export async function listAdminUsers(filters: {
  departmentId?: string
  roleId?: string
  search?: string
  isActive?: boolean
}) {
  const search = filters.search?.trim()
  const users = await prisma.user.findMany({
    where: {
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.roleId ? { roleId: filters.roleId } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { username: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { employeeId: { contains: search } },
              { jobTitle: { contains: search } },
            ],
          }
        : {}),
    },
    select: userSelect,
    orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }, { firstName: 'asc' }],
  })
  return users.map(formatUserRow)
}

export async function getAdminUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect })
  if (!user) return null
  return formatUserRow(user)
}

export async function createAdminUser(
  body: {
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
  },
  actor: AuthenticatedUser
) {
  const email = body.email.trim().toLowerCase()
  const username = body.username?.trim() || null

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(username ? [{ username }] : [])] },
  })
  if (existing) throw new Error('USER_DUPLICATE')

  const passwordHash = await hash(body.password, 10)
  const user = await prisma.$transaction(async (tx) => {
    const id = await allocateUserId(tx)
    return tx.user.create({
      data: {
        id,
        email,
        username,
        passwordHash,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        employeeId: body.employeeId?.trim() || null,
        jobTitle: body.jobTitle?.trim() || null,
        phone: body.phone?.trim() || null,
        lineUserId: body.lineUserId?.trim() || null,
        roleId: body.roleId,
        departmentId: body.departmentId || null,
        isActive: body.isActive ?? true,
      },
      select: userSelect,
    })
  })

  await writeAuditLog({
    userId: actor.id,
    action: 'USER_CREATED',
    entity: 'user',
    entityId: user.id,
    newData: { email: user.email, role: user.role.name },
  })

  return formatUserRow(user)
}

export async function updateAdminUser(
  id: string,
  body: {
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
  },
  actor: AuthenticatedUser
) {
  const existing = await prisma.user.findUnique({ where: { id }, select: userSelect })
  if (!existing) throw new Error('USER_NOT_FOUND')

  const email = body.email?.trim().toLowerCase()
  const username = body.username === undefined ? undefined : body.username?.trim() || null

  if (email || username !== undefined) {
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
      },
    })
    if (conflict) throw new Error('USER_DUPLICATE')
  }

  const data: Record<string, unknown> = {}
  if (email) data.email = email
  if (username !== undefined) data.username = username
  if (body.firstName !== undefined) data.firstName = body.firstName.trim()
  if (body.lastName !== undefined) data.lastName = body.lastName.trim()
  if (body.employeeId !== undefined) data.employeeId = body.employeeId?.trim() || null
  if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle?.trim() || null
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null
  if (body.lineUserId !== undefined) data.lineUserId = body.lineUserId?.trim() || null
  if (body.roleId !== undefined) data.roleId = body.roleId
  if (body.departmentId !== undefined) data.departmentId = body.departmentId || null
  if (body.isActive !== undefined) data.isActive = body.isActive
  if (body.password?.trim()) {
    data.passwordHash = await hash(body.password.trim(), 10)
  }

  const user = await prisma.user.update({ where: { id }, data, select: userSelect })

  await writeAuditLog({
    userId: actor.id,
    action: 'USER_UPDATED',
    entity: 'user',
    entityId: id,
    oldData: { email: existing.email, role: existing.role.name, isActive: existing.isActive },
    newData: { email: user.email, role: user.role.name, isActive: user.isActive },
  })

  return formatUserRow(user)
}
