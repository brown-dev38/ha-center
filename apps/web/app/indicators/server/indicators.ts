import { prisma } from '@/app/common/server/prisma'

export type IndicatorStatus = 'pass' | 'fail' | 'warning' | 'unknown'

export function calcIndicatorStatus(
  value: number,
  targetValue: number | null,
  targetDirection: string
): IndicatorStatus {
  if (targetValue == null) return 'unknown'

  const dir = targetDirection || 'higher'
  if (dir === 'higher') {
    if (value >= targetValue) return 'pass'
    if (value >= targetValue * 0.95) return 'warning'
    return 'fail'
  }
  if (dir === 'lower') {
    if (value <= targetValue) return 'pass'
    if (value <= targetValue * 1.05) return 'warning'
    return 'fail'
  }
  const tolerance = Math.abs(targetValue * 0.02)
  if (Math.abs(value - targetValue) <= tolerance) return 'pass'
  if (Math.abs(value - targetValue) <= tolerance * 3) return 'warning'
  return 'fail'
}

export async function getLatestValue(indicatorId: string, departmentId?: string | null) {
  return prisma.indicatorValue.findFirst({
    where: {
      indicatorId,
      ...(departmentId !== undefined ? { departmentId } : {}),
    },
    orderBy: { period: 'desc' },
  })
}

export function mapIndicatorWithStatus(
  indicator: {
    id: string
    code: string
    name: string
    unit: string | null
    targetValue: number | null
    targetDirection: string
    frequency: string
    isActive: boolean
    category: { id: string; name: string; code: string }
    department: { id: string; name: string; code: string } | null
  },
  latest: { value: number; period: string; note: string | null } | null
) {
  const status: IndicatorStatus = latest
    ? calcIndicatorStatus(latest.value, indicator.targetValue, indicator.targetDirection)
    : 'unknown'

  return {
    id: indicator.id,
    code: indicator.code,
    name: indicator.name,
    unit: indicator.unit,
    targetValue: indicator.targetValue,
    targetDirection: indicator.targetDirection,
    frequency: indicator.frequency,
    isActive: indicator.isActive,
    category: indicator.category,
    department: indicator.department,
    latestValue: latest
      ? { value: latest.value, period: latest.period, note: latest.note, status }
      : null,
    status,
  }
}
