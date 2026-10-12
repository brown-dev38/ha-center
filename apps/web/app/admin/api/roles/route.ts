import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'
import { requireRole } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin')
  if ('error' in auth) return auth.error

  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, displayName: true, description: true },
  })
  return successResponse(roles)
}
