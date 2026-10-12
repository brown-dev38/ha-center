import { successResponse } from '@/app/auth/server/auth-user'
import { getLatestValue, mapIndicatorWithStatus } from '@/app/indicators/server/indicators'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const indicators = await prisma.indicator.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  })

  const mapped = await Promise.all(
    indicators.map(async (ind) => {
      const latest = await getLatestValue(ind.id, ind.departmentId)
      return mapIndicatorWithStatus(ind, latest)
    })
  )

  const summary = {
    total: mapped.length,
    passing: mapped.filter((i) => i.status === 'pass').length,
    failing: mapped.filter((i) => i.status === 'fail').length,
    warning: mapped.filter((i) => i.status === 'warning').length,
  }

  const deptMap = new Map<string | null, typeof mapped>()
  for (const item of mapped) {
    const key = item.department?.id ?? null
    if (!deptMap.has(key)) deptMap.set(key, [])
    deptMap.get(key)!.push(item)
  }

  const byDepartment = Array.from(deptMap.entries()).map(([deptId, items]) => ({
    department: deptId ? items[0].department : null,
    indicators: items,
  }))

  return successResponse({ summary, byDepartment })
}
