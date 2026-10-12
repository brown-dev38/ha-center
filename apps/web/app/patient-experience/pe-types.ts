export type PeDepartmentId = string

export type PePeriodId = 'all' | 'q1' | 'q2' | 'q3' | 'q4' | 'last-30' | 'last-90'

export type PeDepartmentOption = {
  id: PeDepartmentId
  label: string
  group?: 'opd' | 'ipd'
}

export type PePeriodOption = {
  id: PePeriodId
  label: string
}

export type PeKpis = {
  respondents: number
  avgSatisfaction: number
  overallHealthLabel: string
  returnRate: number
  recommendRate: number
  dissatisfactionRate: number
}

export type PeDepartmentRow = {
  id: PeDepartmentId
  label: string
  count: number
  avgSatisfaction: number
  returnRate: number
  recommendRate: number
  dissatisfactionRate: number
  /** คะแนนเฉลี่ยรายข้อส่วนที่ 2 (1–16) ไม่รวมคะแนน 0 */
  part2Avgs?: number[]
}

/** คะแนนเฉลี่ยรายข้อส่วนที่ 2 ตามแบบฟอร์ม */
export type PePart2ItemScore = {
  questionNo: number
  label: string
  shortLabel: string
  avgScore: number
  responseCount: number
  unusedCount: number
}

export type PePart3ThemeStat = {
  themeIndex: number
  label: string
  shortLabel: string
  count: number
  pct: number
}

export type PeDemoBucket = {
  label: string
  count: number
}

export type PeDemographics = {
  visitFrequency: PeDemoBucket[]
  gender: PeDemoBucket[]
  age: PeDemoBucket[]
  education: PeDemoBucket[]
  rights: PeDemoBucket[]
}

export type PeDataset = {
  dateFrom: string
  dateTo: string
  sourceLabel: string
  realtime: boolean
  kpis: PeKpis
  departments: PeDepartmentRow[]
  dimensions: PeDimensionScore[]
  topStrengths: PeRankItem[]
  topImprovements: PeRankItem[]
  comments: PeComment[]
  /** ส่วนที่ 2 — 16 หัวข้อ */
  part2Items: PePart2ItemScore[]
  /** ส่วนที่ 3 — 5 ธีม + อื่น ๆ */
  part3Themes: PePart3ThemeStat[]
  demographics?: PeDemographics
}

export type PeDimensionScore = {
  id: string
  label: string
  score: number
  max: number
}

export type PeRankItem = {
  id: string
  label: string
  metric: string
  value: number
  unit: '%' | 'score'
}

export type PeComment = {
  id: string
  department: string
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  /** ดัชนีธีมส่วนที่ 3 (0–4) หรือ null = อื่น ๆ */
  part3ThemeIndex?: number | null
}
