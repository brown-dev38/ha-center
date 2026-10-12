import type { HscsDataset, HscsDimension, HscsViewId } from '@/app/hscs/hscs-types'
import { getScoreBand } from '@/app/hscs/hscs-scoring'
import {
  getHscsWorkGroupFactors,
  type HscsWorkGroupId,
} from '@/app/hscs/hscs-work-groups'

const ORGANIZATION_DIMENSIONS: HscsDimension[] = [
  {
    id: 'teamwork',
    number: 1,
    title: 'การทำงานเป็นทีม',
    score: 76.0,
    subItems: [
      { code: 'A1', score: 82.8 },
      { code: 'A8', score: 83.9 },
      { code: 'A9', score: 61.5 },
    ],
  },
  {
    id: 'staffing-workspace',
    number: 2,
    title: 'บุคลากรและพื้นที่การทำงาน',
    score: 40.1,
    subItems: [
      { code: 'A2', score: 39.6 },
      { code: 'A3', score: 24.0 },
      { code: 'A5', score: 42.2 },
      { code: 'A11', score: 54.7 },
    ],
  },
  {
    id: 'organizational-learning',
    number: 3,
    title: 'การเป็นองค์กรแห่งการเรียนรู้ มีการพัฒนาอย่างต่อเนื่อง',
    score: 73.6,
    subItems: [
      { code: 'A4', score: 76.6 },
      { code: 'A12', score: 76.0 },
      { code: 'A14', score: 68.2 },
    ],
  },
  {
    id: 'response-to-error',
    number: 4,
    title: 'การตอบสนองต่อความคลาดเคลื่อน',
    score: 49.7,
    subItems: [
      { code: 'A6', score: 37.5 },
      { code: 'A7', score: 44.3 },
      { code: 'A10', score: 63.0 },
      { code: 'A13', score: 54.2 },
    ],
  },
  {
    id: 'supervisor-support',
    number: 5,
    title: 'การสนับสนุนของหัวหน้างาน, ผู้จัดการ หรือผู้บริหารระดับต้นในเรื่องความปลอดภัย',
    score: 58.7,
    subItems: [
      { code: 'B1', score: 75.0 },
      { code: 'B2', score: 26.6 },
      { code: 'B3', score: 74.5 },
    ],
  },
  {
    id: 'communication-error',
    number: 6,
    title: 'การสื่อสารเรื่องความคลาดเคลื่อน',
    score: 76.6,
    subItems: [
      { code: 'C1', score: 71.4 },
      { code: 'C2', score: 80.7 },
      { code: 'C3', score: 77.6 },
    ],
  },
  {
    id: 'communication-openness',
    number: 7,
    title: 'การสื่อสารที่เปิดกว้าง',
    score: 64.6,
    subItems: [
      { code: 'C4', score: 81.2 },
      { code: 'C5', score: 63.0 },
      { code: 'C6', score: 74.0 },
      { code: 'C7', score: 40.1 },
    ],
  },
  {
    id: 'incident-reporting',
    number: 8,
    title: 'การรายงานเหตุการณ์ความปลอดภัยของผู้ป่วย /ผู้รับบริการ',
    score: 55.7,
    subItems: [
      { code: 'D1', score: 54.2 },
      { code: 'D2', score: 57.3 },
    ],
  },
  {
    id: 'management-support',
    number: 9,
    title: 'การสนับสนุนจากทีมผู้บริหารของสถานพยาบาลในเรื่องความปลอดภัยของผู้ป่วย /ผู้รับบริการ',
    score: 56.9,
    subItems: [
      { code: 'F1', score: 77.1 },
      { code: 'F2', score: 65.1 },
      { code: 'F3', score: 28.6 },
    ],
  },
  {
    id: 'handoffs',
    number: 10,
    title: 'การส่งต่องานและแลกเปลี่ยนข้อมูล ในการเปลี่ยนผ่านระหว่างหน่วยงานหรือเวร',
    score: 66.5,
    subItems: [
      { code: 'F4', score: 60.9 },
      { code: 'F5', score: 64.1 },
      { code: 'F6', score: 74.5 },
    ],
  },
]

function countUrgent(dimensions: HscsDimension[]) {
  let urgentCount = 0
  let urgentItems = 0
  for (const dim of dimensions) {
    const band = getScoreBand(dim.score)
    if (band === 'red' || band === 'orange') {
      urgentCount += 1
    }
    for (const sub of dim.subItems) {
      const subBand = getScoreBand(sub.score)
      if (subBand === 'red' || subBand === 'orange') urgentItems += 1
    }
  }
  return { urgentCount, urgentItems }
}

function adjustDimensions(
  base: HscsDimension[],
  factor: number,
  respondentScale: number
): { dimensions: HscsDimension[]; respondents: number } {
  const dimensions = base.map((dim) => ({
    ...dim,
    score: dim.score === null ? null : Math.min(99.9, Math.max(0, dim.score * factor)),
    subItems: dim.subItems.map((sub) => ({
      ...sub,
      score: sub.score === null ? null : Math.min(99.9, Math.max(0, sub.score * factor)),
    })),
  }))
  return {
    dimensions,
    respondents: Math.round(192 * respondentScale),
  }
}

function buildDataset(
  year: number,
  viewId: HscsViewId,
  scopeId: HscsWorkGroupId,
  dimensions: HscsDimension[],
  respondents: number,
  overallOverride?: number | null
): HscsDataset {
  const subDimensions = dimensions.reduce((sum, d) => sum + d.subItems.length, 0)
  const scores = dimensions.map((d) => d.score).filter((s): s is number => s !== null)
  const computedOverall =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
  const { urgentCount, urgentItems } = countUrgent(dimensions)

  return {
    year,
    viewId,
    scopeId,
    summary: {
      overallScore: overallOverride ?? computedOverall,
      respondents,
      mainDimensions: dimensions.length,
      subDimensions,
      urgentCount,
      urgentItems,
    },
    dimensions,
    updatedAt: `${year - 543}-08-18T09:00:00+07:00`,
  }
}

const VIEW_FACTORS: Record<Exclude<HscsViewId, 'overview'>, { factor: number; respondents: number }> =
  {
    'matrix-executive': { factor: 1.04, respondents: 0.12 },
    'matrix-public-health': { factor: 0.98, respondents: 0.18 },
    'matrix-support': { factor: 0.94, respondents: 0.22 },
    'matrix-medical': { factor: 1.01, respondents: 0.16 },
    'matrix-nursing': { factor: 0.97, respondents: 0.2 },
    'matrix-pharmacy': { factor: 1.02, respondents: 0.08 },
    'matrix-allied-health': { factor: 0.96, respondents: 0.14 },
    'matrix-other': { factor: 0.92, respondents: 0.1 },
  }

export function getHscsDataset(
  year: number,
  viewId: HscsViewId,
  scopeId: HscsWorkGroupId = 'organization'
): HscsDataset | null {
  if (![2567, 2568, 2569].includes(year)) return null

  const yearFactor = year === 2567 ? 0.94 : year === 2568 ? 0.97 : 1
  const yearRespondentScale = year === 2567 ? 0.88 : year === 2568 ? 0.94 : 1
  const { scoreFactor: scopeFactor, respondentScale: scopeRespondentScale } =
    getHscsWorkGroupFactors(scopeId)

  const baseFactor = yearFactor * scopeFactor
  const baseRespondents = Math.round(192 * yearRespondentScale * scopeRespondentScale)

  if (viewId === 'overview') {
    const dimensions = ORGANIZATION_DIMENSIONS.map((dim) => ({
      ...dim,
      score: dim.score === null ? null : Math.min(99.9, dim.score * baseFactor),
      subItems: dim.subItems.map((sub) => ({
        ...sub,
        score: sub.score === null ? null : Math.min(99.9, sub.score * baseFactor),
      })),
    }))
    const overallOverride =
      scopeId === 'organization' ? 61.8 * yearFactor : undefined
    return buildDataset(
      year,
      viewId,
      scopeId,
      dimensions,
      scopeId === 'organization' ? Math.round(192 * yearRespondentScale) : baseRespondents,
      overallOverride
    )
  }

  const cfg = VIEW_FACTORS[viewId]
  const { dimensions, respondents } = adjustDimensions(
    ORGANIZATION_DIMENSIONS,
    cfg.factor * baseFactor,
    cfg.respondents * scopeRespondentScale
  )
  return buildDataset(year, viewId, scopeId, dimensions, respondents)
}

export function getHscsDatasetKey(
  year: number,
  viewId: HscsViewId,
  scopeId: HscsWorkGroupId = 'organization'
): string {
  return `${year}:${viewId}:${scopeId}`
}
