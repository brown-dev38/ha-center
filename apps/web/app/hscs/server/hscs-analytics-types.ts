/**
 * HSCS Excel → analytics types
 * Positive score = % of valid ratings that are 4 or 5 (exclude 0 / blank / non-numeric)
 */

export type HscsCleanRating = number | null // 1–5 only; null = excluded

export type HscsQuestionMeta = {
  key: string
  section: string // A | B | C | D | E | F | G | H | …
  code: string // e.g. A1
  label: string
  colIndex: number
  kind: 'likert' | 'safety_grade' | 'frequency' | 'text' | 'meta' | 'unknown'
}

export type HscsResponseRow = {
  staffId: string
  department: string
  profession: string
  submittedAt: string | null
  ratings: Record<string, HscsCleanRating>
  texts: Record<string, string>
}

export type HscsDimensionScore = {
  section: string
  title: string
  mean: number | null
  positivePct: number | null
  n: number
}

export type HscsHeatCell = {
  department: string
  section: string
  positivePct: number | null
  mean: number | null
  n: number
}

export type HscsQuestionRank = {
  key: string
  code: string
  section: string
  label: string
  positivePct: number | null
  mean: number | null
  n: number
}

export type HscsSuggestionRow = {
  staffId: string
  department: string
  text: string
}

export type HscsExecutiveKpis = {
  totalRespondents: number
  overallPositivePct: number | null
  safetyGradeAvg: number | null
  incidentReportingIndex: number | null
}

export type HscsExecutiveDashboard = {
  sourceFile: string
  generatedAt: string
  kpis: HscsExecutiveKpis
  departments: string[]
  dimensions: HscsDimensionScore[]
  heatmap: HscsHeatCell[]
  topStrengths: HscsQuestionRank[]
  topImprovements: HscsQuestionRank[]
  suggestions: HscsSuggestionRow[]
  dateMin: string | null
  dateMax: string | null
  warnings: string[]
}

export type HscsDashboardFilters = {
  department?: string | 'all'
  dateFrom?: string | null
  dateTo?: string | null
}

/** Thai / EN titles for HSOPS-style sections used in UPH HSCS */
export const HSCS_SECTION_TITLES: Record<string, string> = {
  A: 'A — การทำงานเป็นทีม',
  B: 'B — บุคลากรและพื้นที่การทำงาน',
  C: 'C — องค์กรแห่งการเรียนรู้',
  D: 'D — การตอบสนองต่อความคลาดเคลื่อน',
  E: 'E — การสนับสนุนของหัวหน้างาน / Safety Grade',
  F: 'F — การสื่อสารเรื่องความคลาดเคลื่อน',
  G: 'G — การรายงานเหตุการณ์ / ความถี่',
  H: 'H — ข้อเสนอแนะ / ความคิดเห็น',
}
