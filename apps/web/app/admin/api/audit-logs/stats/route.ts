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
  const days = Math.min(Math.max(Number(searchParams.get('days') ?? 7), 1), 90)
  const from = new Date(Date.now() - days * 86400_000)

  const [byAction, byEntity, total, recentByDay, topUsers] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: from } },
      _count: { _all: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ['entity'],
      where: { createdAt: { gte: from } },
      _count: { _all: true },
      orderBy: { _count: { entity: 'desc' } },
      take: 10,
    }),
    prisma.auditLog.count({ where: { createdAt: { gte: from } } }),
    prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
      `SELECT DATE(created_at) as day, COUNT(*) as count FROM audit_logs WHERE created_at >= ? GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30`,
      from
    ),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: from }, userId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
  ])

  const userIds = topUsers.map((u) => u.userId).filter((id): id is string => !!id)
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      })
    : []

  const userMap = new Map(
    users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim() || u.email])
  )

  return successResponse({
    total,
    days,
    byAction: byAction.map((a) => ({ action: a.action, count: a._count._all })),
    byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count._all })),
    byDay: recentByDay.map((d) => ({
      day: typeof d.day === 'string' ? d.day : new Date(d.day).toISOString().slice(0, 10),
      count: Number(d.count),
    })),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      name: u.userId ? (userMap.get(u.userId) ?? 'ไม่ทราบชื่อ') : 'ระบบ',
      count: u._count._all,
    })),
  })
}
