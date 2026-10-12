import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'
import { requireRole } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin')
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 50), 1), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  const entity = searchParams.get('entity')
  const action = searchParams.get('action')
  const userId = searchParams.get('userId')
  const search = searchParams.get('search')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (entity) where.entity = entity
  if (action) where.action = { contains: action }
  if (userId) where.userId = userId
  if (search) {
    where.OR = [
      { entityId: { contains: search } },
      { action: { contains: search } },
    ]
  }
  if (from || to) {
    const createdAt: Record<string, Date> = {}
    if (from) createdAt.gte = new Date(from)
    if (to) createdAt.lte = new Date(to)
    where.createdAt = createdAt
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: { select: { name: true, displayName: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return successResponse({
    data: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      oldData: log.oldData,
      newData: log.newData,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: log.user
        ? {
            id: log.user.id,
            name: `${log.user.firstName} ${log.user.lastName}`.trim() || log.user.email,
            email: log.user.email,
            role: log.user.role?.displayName ?? log.user.role?.name ?? null,
            departmentName: log.user.department?.name ?? null,
          }
        : null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
