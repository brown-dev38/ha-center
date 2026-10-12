import { successResponse } from '@/app/auth/server/auth-user'
import { mapCqiListItem } from '@/app/cqi/server/cqi'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const projects = await prisma.cqiProject.findMany({
    where: { isActive: true, isOutstanding: true },
    include: {
      department: true,
      lead: { select: { id: true, firstName: true, lastName: true } },
      awards: true,
    },
    orderBy: [{ year: 'desc' }, { title: 'asc' }],
  })

  const byYear = new Map<number | null, typeof projects>()
  for (const p of projects) {
    const y = p.year
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(p)
  }

  const data = Array.from(byYear.entries())
    .sort(([a], [b]) => (b ?? 0) - (a ?? 0))
    .map(([year, items]) => ({
      year,
      projects: items.map(mapCqiListItem),
    }))

  return successResponse(data)
}
