import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { getLatestValue, mapIndicatorWithStatus } from '@/app/indicators/server/indicators'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const indicators = await prisma.indicator.findMany({
    where: {
      ...(searchParams.get('isActive') !== undefined
        ? { isActive: searchParams.get('isActive') === 'true' }
        : { isActive: true }),
      ...(searchParams.get('categoryId') ? { categoryId: searchParams.get('categoryId')! } : {}),
      ...(searchParams.get('departmentId') ? { departmentId: searchParams.get('departmentId')! } : {}),
    },
    include: {
      category: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
    },
    orderBy: { code: 'asc' },
  })

  const data = await Promise.all(
    indicators.map(async (ind) => {
      const latest = await getLatestValue(ind.id, ind.departmentId)
      return mapIndicatorWithStatus(ind, latest)
    })
  )

  return successResponse(data)
}
