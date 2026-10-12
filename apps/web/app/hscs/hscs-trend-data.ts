import type { HscsWorkGroupId } from '@/app/hscs/hscs-work-groups'
import { getHscsWorkGroupFactors } from '@/app/hscs/hscs-work-groups'

export type HscsTrendPoint = {
  year: number
  score: number | null
}

export type HscsTrendDimension = {
  id: string
  number: number
  title: string
  points: HscsTrendPoint[]
}

export type HscsTrendDataset = {
  scopeId: HscsWorkGroupId
  unitLabel: string
  compareFrom: number
  compareTo: number
  axisYears: number[]
  dimensions: HscsTrendDimension[]
}

/** คะแนนแนวโน้มตัวอย่าง — กลุ่มงานแพทย์ (ตามเอกสารอ้างอิง) */
const MEDICINE_TREND_BASE: Omit<HscsTrendDimension, 'points'>[] = [
  { id: 't1', number: 1, title: 'การทำงานเป็นทีม' },
  { id: 't2', number: 2, title: 'บุคลากรและพื้นที่การทำงาน' },
  {
    id: 't3',
    number: 3,
    title: 'การเป็นองค์กรแห่งการเรียนรู้ มีการพัฒนาอย่างต่อเนื่อง',
  },
  { id: 't4', number: 4, title: 'การตอบสนองต่อความคลาดเคลื่อน' },
  {
    id: 't5',
    number: 5,
    title: 'การสนับสนุนของหัวหน้างาน, ผู้จัดการ หรือทีมนำทางคลินิก',
  },
  { id: 't6', number: 6, title: 'การสื่อสารเรื่องความคลาดเคลื่อน' },
  { id: 't7', number: 7, title: 'การสื่อสารที่เปิดกว้าง' },
  {
    id: 't8',
    number: 8,
    title: 'การรายงานเหตุการณ์ความปลอดภัยของผู้ป่วย/ผู้รับบริการ',
  },
  {
    id: 't9',
    number: 9,
    title: 'การสนับสนุนจากทีมผู้บริหารของสถานพยาบาลในเรื่องความปลอดภัย',
  },
  {
    id: 't10',
    number: 10,
    title: 'การส่งต่องานและแลกเปลี่ยนข้อมูล ในการเปลี่ยนผ่านระบบการดูแลต่อเนื่อง',
  },
]

const MEDICINE_SCORES_2568_2569: [number, number][] = [
  [70.8, 73.3],
  [28.1, 35.0],
  [62.5, 73.3],
  [21.9, 70.0],
  [54.2, 40.0],
  [62.5, 60.0],
  [53.1, 75.0],
  [56.2, 30.0],
  [66.7, 53.3],
  [45.8, 66.7],
]

const ORGANIZATION_SCORES_2568_2569: [number, number][] = [
  [74.2, 76.0],
  [52.4, 55.8],
  [68.1, 71.5],
  [58.3, 63.8],
  [64.5, 66.7],
  [50.2, 52.1],
  [61.8, 65.4],
  [59.6, 62.0],
  [67.2, 69.8],
  [70.1, 72.4],
]

function clampScore(value: number): number {
  return Math.round(Math.min(99.9, Math.max(0, value)) * 10) / 10
}

function buildPoints(
  axisYears: number[],
  compareFrom: number,
  compareTo: number,
  fromScore: number,
  toScore: number
): HscsTrendPoint[] {
  return axisYears.map((y) => ({
    year: y,
    score: y === compareFrom ? fromScore : y === compareTo ? toScore : null,
  }))
}

function scalePair(
  pair: [number, number],
  factor: number,
  index: number
): [number, number] {
  const drift = ((index % 3) - 1) * 1.5
  return [clampScore(pair[0] * factor + drift), clampScore(pair[1] * factor - drift * 0.5)]
}

export function getHscsTrendDataset(
  scopeId: HscsWorkGroupId,
  selectedYear: number,
  unitLabel: string
): HscsTrendDataset {
  const compareTo = selectedYear
  const compareFrom = selectedYear - 1
  const axisYears = [compareFrom, compareTo, compareTo + 1, compareTo + 2, compareTo + 3]

  const basePairs =
    scopeId === 'medicine'
      ? MEDICINE_SCORES_2568_2569
      : scopeId === 'organization'
        ? ORGANIZATION_SCORES_2568_2569
        : MEDICINE_SCORES_2568_2569.map((pair, i) =>
            scalePair(pair, getHscsWorkGroupFactors(scopeId).scoreFactor, i)
          )

  const dimensions: HscsTrendDimension[] = MEDICINE_TREND_BASE.map((dim, index) => {
    const [fromScore, toScore] = basePairs[index] ?? [null, null]
    return {
      ...dim,
      points: buildPoints(axisYears, compareFrom, compareTo, fromScore, toScore),
    }
  })

  return {
    scopeId,
    unitLabel,
    compareFrom,
    compareTo,
    axisYears,
    dimensions,
  }
}
