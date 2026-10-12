import type {
  PeComment,
  PeDataset,
  PeDepartmentId,
  PeDepartmentRow,
  PeRankItem,
} from '@/app/patient-experience/pe-types'
import {
  peClampDisplayRange,
  peDateRangeOverlapFactor,
  type PeDateRange,
} from '@/app/patient-experience/pe-date-range'
import {
  annotateCommentsWithThemes,
  buildPart2DimensionScores,
  buildPart3FromComments,
  mergePart2AcrossDepartments,
  synthesizePart2Avgs,
} from '@/app/patient-experience/pe-survey-analytics'
import { PE_SURVEY_DEPARTMENTS } from '@/app/patient-experience/pe-survey-form-content'
/** หน่วยงานตัวอย่างตามแบบฟอร์ม รพ.มหาวิทยาลัยพะเยา */
const SEED_META: Array<{
  id: string
  label: string
  count: number
  avgSatisfaction: number
  returnRate: number
  recommendRate: number
  dissatisfactionRate: number
}> = [
  {
    id: 'ผู้ป่วยนอก-1',
    label: 'ผู้ป่วยนอก 1',
    count: 286,
    avgSatisfaction: 4.62,
    returnRate: 98.8,
    recommendRate: 98.9,
    dissatisfactionRate: 6.2,
  },
  {
    id: 'opd-2-ตรวจสุขภาพ',
    label: 'OPD 2 ตรวจสุขภาพ',
    count: 214,
    avgSatisfaction: 4.78,
    returnRate: 99.3,
    recommendRate: 99.4,
    dissatisfactionRate: 3.9,
  },
  {
    id: 'opd-3-กุมารเวชกรรม',
    label: 'OPD 3 กุมารเวชกรรม',
    count: 168,
    avgSatisfaction: 4.7,
    returnRate: 99.1,
    recommendRate: 99.0,
    dissatisfactionRate: 4.8,
  },
  {
    id: 'ผู้ป่วยนอก-3-สูตินรีเวช',
    label: 'ผู้ป่วยนอก 3 สูตินรีเวช',
    count: 152,
    avgSatisfaction: 4.74,
    returnRate: 99.2,
    recommendRate: 99.3,
    dissatisfactionRate: 4.1,
  },
  {
    id: 'ผู้ป่วยนอก-3-ตา-หู-คอ-จมูก',
    label: 'ผู้ป่วยนอก 3 ตา หู คอ จมูก',
    count: 198,
    avgSatisfaction: 4.71,
    returnRate: 99.0,
    recommendRate: 99.1,
    dissatisfactionRate: 4.6,
  },
  {
    id: 'opd-4-คลินิกโรคหัวใจ',
    label: 'OPD 4 คลินิกโรคหัวใจ',
    count: 121,
    avgSatisfaction: 4.68,
    returnRate: 98.9,
    recommendRate: 99.0,
    dissatisfactionRate: 5.2,
  },
  {
    id: 'opd-4-คลินิกโรคไม่ติดต่อเรื้อรัง',
    label: 'OPD 4 คลินิกโรคไม่ติดต่อเรื้อรัง',
    count: 176,
    avgSatisfaction: 4.65,
    returnRate: 99.0,
    recommendRate: 98.8,
    dissatisfactionRate: 5.8,
  },
  {
    id: 'ศูนย์ศัลยกรรมกระดูกและข้อ',
    label: 'ศูนย์ศัลยกรรมกระดูกและข้อ',
    count: 134,
    avgSatisfaction: 4.59,
    returnRate: 98.6,
    recommendRate: 98.7,
    dissatisfactionRate: 7.1,
  },
  {
    id: 'ผู้ป่วยฉุกเฉิน',
    label: 'ผู้ป่วยฉุกเฉิน',
    count: 247,
    avgSatisfaction: 4.48,
    returnRate: 97.9,
    recommendRate: 98.1,
    dissatisfactionRate: 9.4,
  },
  {
    id: 'กายภาพบำบัด',
    label: 'กายภาพบำบัด',
    count: 96,
    avgSatisfaction: 4.73,
    returnRate: 99.4,
    recommendRate: 99.2,
    dissatisfactionRate: 4.2,
  },
  {
    id: 'เภสัชกรรม',
    label: 'เภสัชกรรม',
    count: 203,
    avgSatisfaction: 4.66,
    returnRate: 99.1,
    recommendRate: 99.0,
    dissatisfactionRate: 5.5,
  },
  {
    id: 'ผู้ป่วยในสามัญ',
    label: 'ผู้ป่วยในสามัญ',
    count: 112,
    avgSatisfaction: 4.64,
    returnRate: 98.7,
    recommendRate: 98.9,
    dissatisfactionRate: 6.0,
  },
  {
    id: 'ผู้ป่วยวิกฤต-icu',
    label: 'ผู้ป่วยวิกฤต (ICU)',
    count: 48,
    avgSatisfaction: 4.55,
    returnRate: 98.2,
    recommendRate: 98.5,
    dissatisfactionRate: 7.8,
  },
  {
    id: 'ห้องคลอด',
    label: 'ห้องคลอด',
    count: 67,
    avgSatisfaction: 4.76,
    returnRate: 99.3,
    recommendRate: 99.4,
    dissatisfactionRate: 3.6,
  },
]

// Align ids with PE_SURVEY_DEPARTMENTS when possible
const BASE_ROWS: PeDepartmentRow[] = SEED_META.map((row, i) => {
  const matched = PE_SURVEY_DEPARTMENTS.find((d) => d.label === row.label)
  return {
    ...row,
    id: matched?.id ?? row.id,
    part2Avgs: synthesizePart2Avgs(row.avgSatisfaction, i),
  }
})

const SEED_DATE_FROM = '2025-10-01'
const SEED_DATE_TO = '2026-08-14'

const COMMENT_BANK: Array<Omit<PeComment, 'id'>> = [
  {
    department: 'ผู้ป่วยฉุกเฉิน',
    text: 'รอคิวนานในช่วงเช้า อยากให้เพิ่มจุดลงทะเบียนและป้ายบอกทาง',
    sentiment: 'negative',
    part3ThemeIndex: 1,
  },
  {
    department: 'ผู้ป่วยนอก 3 ตา หู คอ จมูก',
    text: 'แพทย์อธิบายอาการเข้าใจง่าย และเปิดโอกาสให้ซักถามอย่างเต็มที่',
    sentiment: 'positive',
    part3ThemeIndex: 0,
  },
  {
    department: 'กายภาพบำบัด',
    text: 'เจ้าหน้าที่ดูแลเอาใจใส่ เป็นกันเอง ปฏิบัติงานเต็มที่',
    sentiment: 'positive',
    part3ThemeIndex: 0,
  },
  {
    department: 'OPD 2 ตรวจสุขภาพ',
    text: 'ได้รับคำแนะนำ และขั้นตอนในการรับบริการของเจ้าหน้าที่ได้อย่างครบถ้วน',
    sentiment: 'positive',
    part3ThemeIndex: 1,
  },
  {
    department: 'ผู้ป่วยในสามัญ',
    text: 'รพ.มีกระบวนการดูแลรักษาที่มีมาตรฐาน ทำให้เชื่อมั่นและไว้วางใจ',
    sentiment: 'positive',
    part3ThemeIndex: 1,
  },
  {
    department: 'เภสัชกรรม',
    text: 'ได้รับข้อมูลการใช้ยา ผลข้างเคียงชัดเจน แต่รอนานเล็กน้อย',
    sentiment: 'neutral',
    part3ThemeIndex: 4,
  },
  {
    department: 'ศูนย์ศัลยกรรมกระดูกและข้อ',
    text: 'ต้องการข้อมูลเตรียมตัวก่อนผ่าตัดที่ชัดเจนกว่านี้',
    sentiment: 'negative',
    part3ThemeIndex: 4,
  },
  {
    department: 'ห้องคลอด',
    text: 'รพ. มีบรรยากาศที่ดี ไม่แออัด สะดวกต่อการมารับบริการ',
    sentiment: 'positive',
    part3ThemeIndex: 2,
  },
  {
    department: 'OPD 4 คลินิกโรคหัวใจ',
    text: 'เจ้าหน้าที่ ทีมงาน มีความรู้และประสบการณ์ในการดูแลรักษา',
    sentiment: 'positive',
    part3ThemeIndex: 0,
  },
  {
    department: 'ผู้ป่วยนอก 1',
    text: 'อยากให้แจ้งคิวนัดทาง LINE ให้เร็วขึ้น',
    sentiment: 'neutral',
    part3ThemeIndex: 3,
  },
]

function healthLabel(avg: number): string {
  if (avg >= 4.7) return 'ดีมาก'
  if (avg >= 4.4) return 'ปานกลาง'
  if (avg >= 4.0) return 'พอใช้'
  return 'ต้องพัฒนา'
}

function aggregate(rows: PeDepartmentRow[]) {
  const respondents = rows.reduce((s, r) => s + r.count, 0)
  if (respondents === 0) {
    return {
      respondents: 0,
      avgSatisfaction: 0,
      overallHealthLabel: 'ไม่มีข้อมูล',
      returnRate: 0,
      recommendRate: 0,
      dissatisfactionRate: 0,
    }
  }

  const weighted = (
    key: keyof Pick<
      PeDepartmentRow,
      'avgSatisfaction' | 'returnRate' | 'recommendRate' | 'dissatisfactionRate'
    >
  ) => rows.reduce((s, r) => s + r[key] * r.count, 0) / respondents

  const avgSatisfaction = weighted('avgSatisfaction')

  return {
    respondents,
    avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
    overallHealthLabel: healthLabel(avgSatisfaction),
    returnRate: Math.round(weighted('returnRate') * 10) / 10,
    recommendRate: Math.round(weighted('recommendRate') * 10) / 10,
    dissatisfactionRate: Math.round(weighted('dissatisfactionRate') * 10) / 10,
  }
}

function buildRanks(rows: PeDepartmentRow[]): {
  topStrengths: PeRankItem[]
  topImprovements: PeRankItem[]
} {
  const bySat = [...rows].sort((a, b) => b.avgSatisfaction - a.avgSatisfaction)
  const byDissat = [...rows].sort((a, b) => b.dissatisfactionRate - a.dissatisfactionRate)

  return {
    topStrengths: bySat.slice(0, 5).map((r) => ({
      id: r.id,
      label: r.label,
      metric: 'คะแนนพึงพอใจ (ส่วนที่ 2)',
      value: r.avgSatisfaction,
      unit: 'score' as const,
    })),
    topImprovements: byDissat.slice(0, 5).map((r) => ({
      id: r.id,
      label: r.label,
      metric: '% ไม่พึงพอใจ',
      value: r.dissatisfactionRate,
      unit: '%' as const,
    })),
  }
}

function buildComments(departmentId: PeDepartmentId, rows: PeDepartmentRow[]): PeComment[] {
  const labels = new Set(rows.map((r) => r.label))
  return annotateCommentsWithThemes(
    COMMENT_BANK.filter((c) => departmentId === 'all' || labels.has(c.department)).map(
      (c, i) => ({ ...c, id: `c${i + 1}` })
    )
  )
}

function finalize(
  rows: PeDepartmentRow[],
  kpis: ReturnType<typeof aggregate>,
  departmentId: PeDepartmentId,
  dateFrom = SEED_DATE_FROM,
  dateTo = SEED_DATE_TO
): PeDataset {
  const ranks = buildRanks(rows)
  const comments = buildComments(departmentId, rows)
  const part2Items = mergePart2AcrossDepartments(rows)
  return {
    dateFrom,
    dateTo,
    sourceLabel: 'แบบประเมินรับฟังความคิดเห็นผู้ป่วย · ข้อมูลตัวอย่าง',
    realtime: true,
    kpis,
    departments: rows,
    dimensions: buildPart2DimensionScores(part2Items),
    topStrengths: ranks.topStrengths,
    topImprovements: ranks.topImprovements,
    comments,
    part2Items,
    part3Themes: buildPart3FromComments(comments),
    demographics: {
      visitFrequency: [
        { label: 'ครั้งแรก', count: 108 },
        { label: 'มากกว่า 1 ครั้ง', count: 439 },
      ],
      gender: [
        { label: 'ชาย', count: 196 },
        { label: 'หญิง', count: 351 },
      ],
      age: [
        { label: '19-35 ปี', count: 23 },
        { label: '52-70 ปี', count: 71 },
        { label: '70 ปี ขึ้นไป', count: 453 },
      ],
      education: [
        { label: 'ประถมศึกษา', count: 88 },
        { label: 'มัธยมศึกษา', count: 95 },
        { label: 'อนุปริญญา', count: 44 },
        { label: 'ปริญญาตรี', count: 253 },
        { label: 'สูงกว่าปริญญาตรี', count: 67 },
      ],
      rights: [],
    },
  }
}

export function getPeDataset(
  departmentId: PeDepartmentId,
  dateRange: PeDateRange = { from: '', to: '' }
): PeDataset {
  const factor = peDateRangeOverlapFactor(SEED_DATE_FROM, SEED_DATE_TO, dateRange)
  const display = peClampDisplayRange(SEED_DATE_FROM, SEED_DATE_TO, dateRange)

  if (factor <= 0) {
    return finalize([], {
      respondents: 0,
      avgSatisfaction: 0,
      overallHealthLabel: 'ไม่มีข้อมูล',
      returnRate: 0,
      recommendRate: 0,
      dissatisfactionRate: 0,
    }, departmentId, display.dateFrom, display.dateTo)
  }

  let rows = BASE_ROWS.map((row) => ({
    ...row,
    count: Math.max(1, Math.round(row.count * factor)),
  }))

  if (departmentId !== 'all') {
    rows = rows.filter((r) => r.id === departmentId)
  }

  return finalize(rows, aggregate(rows), departmentId, display.dateFrom, display.dateTo)
}

export const PE_SEED_DATE_SPAN = { from: SEED_DATE_FROM, to: SEED_DATE_TO } as const
