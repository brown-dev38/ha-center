import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { requireRole } from '@/app/auth/server/route-auth'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeUsers,
      totalDocuments,
      hiddenDocuments,
      totalWorksheets,
      departments,
      categories,
      recentAudit,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.haDocument.count({ where: { isActive: true } }),
      prisma.haDocument.count({ where: { isActive: false } }),
      prisma.unitProfileWorksheet.count(),
      prisma.department.count({ where: { isActive: true } }),
      prisma.documentCategory.count({ where: { isActive: true } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    ])

    return successResponse({
      totalUsers,
      activeUsers,
      totalDocuments,
      hiddenDocuments,
      totalWorksheets,
      departments,
      categories,
      recentAudit,
    })
  })
}
