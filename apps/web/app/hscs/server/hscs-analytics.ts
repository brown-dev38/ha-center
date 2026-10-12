import { mean, positivePct, sectionTitle } from '@/app/hscs/server/hscs-clean'
import type {
  HscsDashboardFilters,
  HscsDimensionScore,
  HscsExecutiveDashboard,
  HscsHeatCell,
  HscsQuestionMeta,
  HscsQuestionRank,
  HscsResponseRow,
  HscsSuggestionRow,
} from '@/app/hscs/server/hscs-analytics-types'
import type { ParsedHscsWorkbook } from '@/app/hscs/server/parse-hscs-excel'

function filterRows(rows: HscsResponseRow[], filters?: HscsDashboardFilters): HscsResponseRow[] {
  let out = rows
  if (filters?.department && filters.department !== 'all') {
    out = out.filter((r) => r.department === filters.department)
  }
  if (filters?.dateFrom) {
    out = out.filter((r) => !r.submittedAt || r.submittedAt >= filters.dateFrom!)
  }
  if (filters?.dateTo) {
    out = out.filter((r) => !r.submittedAt || r.submittedAt <= filters.dateTo!)
  }
  return out
}

function collectRatings(
  rows: HscsResponseRow[],
  keys: string[]
): number[] {
  const vals: number[] = []
  for (const row of rows) {
    for (const key of keys) {
      const v = row.ratings[key]
      if (v !== null && v !== undefined) vals.push(v)
    }
  }
  return vals
}

function collectRatingCells(
  rows: HscsResponseRow[],
  keys: string[]
): Array<number | null> {
  const vals: Array<number | null> = []
  for (const row of rows) {
    for (const key of keys) {
      vals.push(row.ratings[key] ?? null)
    }
  }
  return vals
}

function dimensionScores(
  rows: HscsResponseRow[],
  questions: HscsQuestionMeta[],
  sections: string[]
): HscsDimensionScore[] {
  return sections.map((section) => {
    const keys = questions
      .filter((q) => q.section === section && (q.kind === 'likert' || q.kind === 'frequency' || q.kind === 'safety_grade'))
      .map((q) => q.key)
    const cells = collectRatingCells(rows, keys)
    const nums = cells.filter((v): v is number => v !== null)
    return {
      section,
      title: sectionTitle(section),
      mean: mean(nums),
      positivePct: positivePct(cells),
      n: nums.length,
    }
  })
}

function buildHeatmap(
  rows: HscsResponseRow[],
  questions: HscsQuestionMeta[],
  sections: string[]
): HscsHeatCell[] {
  const depts = [...new Set(rows.map((r) => r.department))].sort((a, b) =>
    a.localeCompare(b, 'th')
  )
  const cells: HscsHeatCell[] = []
  for (const department of depts) {
    const subset = rows.filter((r) => r.department === department)
    for (const section of sections) {
      const keys = questions
        .filter((q) => q.section === section && q.kind !== 'text')
        .map((q) => q.key)
      const ratingCells = collectRatingCells(subset, keys)
      const nums = ratingCells.filter((v): v is number => v !== null)
      cells.push({
        department,
        section,
        positivePct: positivePct(ratingCells),
        mean: mean(nums),
        n: nums.length,
      })
    }
  }
  return cells
}

function rankQuestions(
  rows: HscsResponseRow[],
  questions: HscsQuestionMeta[]
): HscsQuestionRank[] {
  const likertQs = questions.filter(
    (q) => q.kind === 'likert' || q.kind === 'frequency' || q.kind === 'safety_grade'
  )
  return likertQs
    .map((q) => {
      const cells = rows.map((r) => r.ratings[q.key] ?? null)
      const nums = cells.filter((v): v is number => v !== null)
      return {
        key: q.key,
        code: q.code,
        section: q.section,
        label: q.label,
        positivePct: positivePct(cells),
        mean: mean(nums),
        n: nums.length,
      }
    })
    .filter((q) => q.n >= 3)
}

function suggestionsFromH(
  rows: HscsResponseRow[],
  questions: HscsQuestionMeta[]
): HscsSuggestionRow[] {
  const textKeys = questions.filter((q) => q.kind === 'text' || q.section === 'H').map((q) => q.key)
  const out: HscsSuggestionRow[] = []
  for (const row of rows) {
    for (const key of textKeys) {
      const text = row.texts[key]
      if (text && text.length >= 2) {
        out.push({ staffId: row.staffId, department: row.department, text })
      }
    }
  }
  return out
}

export function buildHscsExecutiveDashboard(
  parsed: ParsedHscsWorkbook,
  filters?: HscsDashboardFilters
): HscsExecutiveDashboard {
  const rows = filterRows(parsed.rows, filters)
  const { questions, warnings } = parsed

  const chartSections = ['A', 'B', 'C', 'D', 'F'].filter((s) =>
    questions.some((q) => q.section === s)
  )
  // Include E/G in heatmap if present
  const heatSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].filter((s) =>
    questions.some((q) => q.section === s)
  )

  const allLikertKeys = questions
    .filter((q) => q.kind === 'likert' || q.kind === 'frequency' || q.kind === 'safety_grade')
    .map((q) => q.key)

  const overallCells = collectRatingCells(rows, allLikertKeys)

  const eKeys = questions
    .filter((q) => q.section === 'E')
    .map((q) => q.key)
  const safetyGradeAvg = mean(collectRatings(rows, eKeys))

  const dgKeys = questions
    .filter((q) => q.section === 'D' || q.section === 'G')
    .map((q) => q.key)
  const incidentReportingIndex = mean(collectRatings(rows, dgKeys))

  const ranked = rankQuestions(rows, questions)
  const byPositive = [...ranked].sort(
    (a, b) => (b.positivePct ?? -1) - (a.positivePct ?? -1)
  )
  const byLowest = [...ranked].sort(
    (a, b) => (a.positivePct ?? 999) - (b.positivePct ?? 999)
  )

  const dates = rows
    .map((r) => r.submittedAt)
    .filter((d): d is string => Boolean(d))
    .sort()

  const departments = [...new Set(parsed.rows.map((r) => r.department))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'th'))

  return {
    sourceFile: parsed.sourceFile,
    generatedAt: new Date().toISOString(),
    kpis: {
      totalRespondents: rows.length,
      overallPositivePct: positivePct(overallCells),
      safetyGradeAvg,
      incidentReportingIndex,
    },
    departments,
    dimensions: dimensionScores(rows, questions, chartSections),
    heatmap: buildHeatmap(rows, questions, heatSections.length ? heatSections : chartSections),
    topStrengths: byPositive.slice(0, 5),
    topImprovements: byLowest.slice(0, 5),
    suggestions: suggestionsFromH(rows, questions),
    dateMin: dates[0] ?? null,
    dateMax: dates[dates.length - 1] ?? null,
    warnings,
  }
}
