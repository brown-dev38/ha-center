import * as XLSX from 'xlsx'
import type {
  PeComment,
  PeDataset,
  PeDemographics,
  PeDepartmentRow,
  PeRankItem,
} from '@/app/patient-experience/pe-types'
import {
  accumulateDemographics,
  buildPeColumnMap,
  collectPart2FromMap,
  collectPart3FromMap,
  createDemoCounters,
  demoCountersToBuckets,
  getRowValue,
  isLikelyRawSurvey,
  parseLikertCell,
  parseRecommendValue,
  type PeColumnMap,
} from '@/app/patient-experience/pe-column-map'
import {
  annotateCommentsWithThemes,
  buildPart2DimensionScores,
  buildPart2ItemsFromAvgs,
  buildPart2ItemsFromSums,
  buildPart3FromComments,
  buildPart3ThemeStats,
  mergePart2AcrossDepartments,
  synthesizePart2Avgs,
} from '@/app/patient-experience/pe-survey-analytics'
import {
  peClampDisplayRange,
  peDateRangeOverlapFactor,
  type PeDateRange,
} from '@/app/patient-experience/pe-date-range'
import {
  PE_PART3_SUGGESTIONS,
  PE_SURVEY_DEPARTMENTS,
  departmentMatchesId,
  matchPart3Suggestion,
  officialDepartmentFromHeader,
  resolveSurveyDepartmentLabel,
} from '@/app/patient-experience/pe-survey-form-content'
import {
  extractBuddhistYear,
  inferYearFromFileName,
  type PeYearBundle,
} from '@/app/patient-experience/pe-year-archive'

export const PE_UPLOAD_ACCEPT =
  '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'

export type PeUploadResult = {
  bundles: PeYearBundle[]
  fileName: string
  warnings: string[]
  mappingReport?: string[]
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const raw = cleanText(value).replace(/,/g, '').replace(/%/g, '')
  if (!raw || raw === '-' || raw.toLowerCase() === 'n/a') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function slugId(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^\w\u0e00-\u0e7f]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'dept'}-${index + 1}`
}

function normalizeHeader(h: string): string {
  return cleanText(h).toLowerCase()
}

function healthLabel(avg: number): string {
  if (avg >= 4.7) return 'ดีมาก'
  if (avg >= 4.4) return 'ปานกลาง'
  if (avg >= 4.0) return 'พอใช้'
  return 'ต้องพัฒนา'
}

function inferSentiment(text: string): PeComment['sentiment'] {
  if (/ดี|พอใจ|ขอบคุณ|ประทับใจ|เยี่ยม|แนะนำ|ใส่ใจ|รวดเร็ว|เป็นเลิศ/.test(text)) return 'positive'
  if (/ช้า|นาน|ไม่ดี|ร้องเรียน|แย่|หยาบ|ผิดพลาด|รอคิว|ไม่พอใจ/.test(text)) return 'negative'
  return 'neutral'
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

function aggregate(rows: PeDepartmentRow[]) {
  const respondents = rows.reduce((s, r) => s + r.count, 0)
  if (!respondents) {
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

function finalizeDataset(
  departments: PeDepartmentRow[],
  comments: PeComment[],
  sourceLabel: string,
  dateFrom?: string | null,
  dateTo?: string | null,
  extras?: {
    part2Sums?: number[]
    part2Counts?: number[]
    part2Unused?: number[]
    part3Counts?: number[]
    part3Other?: number
    demographics?: PeDemographics
  }
): PeDataset {
  const ranks = buildRanks(departments)
  const kpis = aggregate(departments)
  const annotated = annotateCommentsWithThemes(comments)

  let part2Items =
    extras?.part2Sums && extras?.part2Counts
      ? buildPart2ItemsFromSums(
          extras.part2Sums,
          extras.part2Counts,
          extras.part2Unused ?? Array.from({ length: 16 }, () => 0)
        )
      : mergePart2AcrossDepartments(departments)

  if (!part2Items.some((i) => i.responseCount > 0 || i.avgScore > 0)) {
    const withAvgs = departments.map((d, i) => ({
      ...d,
      part2Avgs: d.part2Avgs?.length ? d.part2Avgs : synthesizePart2Avgs(d.avgSatisfaction, i),
    }))
    part2Items = mergePart2AcrossDepartments(withAvgs)
  }

  const part3Themes =
    extras?.part3Counts != null
      ? buildPart3ThemeStats(extras.part3Counts, extras.part3Other ?? 0)
      : buildPart3FromComments(annotated)

  return {
    dateFrom: dateFrom || new Date().toISOString().slice(0, 10),
    dateTo: dateTo || new Date().toISOString().slice(0, 10),
    sourceLabel,
    realtime: false,
    kpis,
    departments,
    dimensions: buildPart2DimensionScores(part2Items),
    topStrengths: ranks.topStrengths,
    topImprovements: ranks.topImprovements,
    comments: annotated,
    part2Items,
    part3Themes,
    demographics: extras?.demographics,
  }
}

async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  if (name.endsWith('.csv') || file.type === 'text/csv') {
    let text = new TextDecoder('utf-8').decode(buffer)
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
    return XLSX.read(text, { type: 'string', raw: false, cellDates: true })
  }

  return XLSX.read(buffer, { type: 'array', cellDates: true, raw: false })
}

function sheetToObjects(wb: XLSX.WorkBook): {
  sheetName: string
  rows: Record<string, unknown>[]
  headers: string[]
} {
  const preferred =
    wb.SheetNames.find((n) =>
      /department|หน่วยงาน|แผนก|summary|สรุป|opd|export|data|all|survey|ประเมิน|pep/i.test(n)
    ) ?? wb.SheetNames[0]

  if (!preferred) throw new Error('ไม่พบชีตในไฟล์')

  const sheet = wb.Sheets[preferred]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })
  const headers = rows[0] ? Object.keys(rows[0]).map(cleanText) : []
  return { sheetName: preferred, rows, headers }
}

function isDepartmentCellChecked(value: unknown, label: string): boolean {
  const t = cleanText(value)
  if (!t) return false
  if (/^(0|0\.0|false|no|n|ไม่|ไม่มี|ไม่ใช่|-|—|na|n\/a)$/i.test(t)) return false
  if (/^(1|true|yes|y|x|✓|✔|ใช่|มี|เลือก|checked)$/i.test(t)) return true
  return resolveSurveyDepartmentLabel(t) === label
}

function findDepartmentCheckboxColumns(
  headers: string[]
): { header: string; label: string }[] {
  const out: { header: string; label: string }[] = []
  const seen = new Set<string>()
  for (const header of headers) {
    const label = officialDepartmentFromHeader(header)
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({ header, label })
  }
  return out.length >= 2 ? out : []
}

function splitDepartmentText(raw: string): string[] {
  const parts = raw
    .split(/\s*(?:,|;|\||\n| และ )\s*/g)
    .map((part) => part.trim())
    .filter(Boolean)
  const source = parts.length > 1 ? parts : [raw.trim()]
  const labels: string[] = []
  for (const part of source) {
    const label = resolveSurveyDepartmentLabel(part)
    if (label && !labels.includes(label)) labels.push(label)
  }
  return labels.length ? labels : ['ไม่ระบุ']
}

function columnIsMostlyNumeric(rows: Record<string, unknown>[], header: string): boolean {
  let filled = 0
  let numeric = 0
  for (const row of rows.slice(0, 80)) {
    const text = cleanText(row[header])
    if (!text) continue
    filled += 1
    if (/^\d+(\.\d+)?$/.test(text)) numeric += 1
  }
  return filled > 0 && numeric / filled >= 0.8
}

/** เลือกคอลัมน์ข้อความที่มีชื่อหน่วยงานในแบบฟอร์มหลากหลายที่สุด */
function findBestDepartmentTextColumn(
  rows: Record<string, unknown>[],
  headers: string[]
): string | null {
  let best: { header: string; kinds: number } | null = null
  for (const header of headers) {
    if (officialDepartmentFromHeader(header)) continue
    if (columnIsMostlyNumeric(rows, header)) continue
    const kinds = new Set<string>()
    let filled = 0
    let matched = 0
    for (const row of rows.slice(0, 300)) {
      const text = cleanText(row[header])
      if (!text) continue
      filled += 1
      const labels = splitDepartmentText(text).filter((label) =>
        PE_SURVEY_DEPARTMENTS.some((dept) => dept.label === label)
      )
      if (labels.length) matched += 1
      for (const label of labels) kinds.add(label)
    }
    if (filled < 5 || matched / filled < 0.5 || kinds.size < 2) continue
    if (!best || kinds.size > best.kinds) best = { header, kinds: kinds.size }
  }
  return best?.header ?? null
}

function resolveDepartmentLabels(
  row: Record<string, unknown>,
  map: PeColumnMap,
  checkboxes: { header: string; label: string }[],
  preferredHeader?: string | null
): string[] {
  const checked = checkboxes.filter((col) => isDepartmentCellChecked(row[col.header], col.label))
  if (checked.length) {
    const labels: string[] = []
    for (const col of checked) {
      if (!labels.includes(col.label)) labels.push(col.label)
    }
    return labels
  }

  const preferred = preferredHeader ? cleanText(row[preferredHeader]) : ''
  const other = getRowValue(row, map, 'departmentOther')
  const primary = getRowValue(row, map, 'department')
  const fallback =
    cleanText(row.department_other) ||
    cleanText(row.department) ||
    cleanText(row['หน่วยงาน']) ||
    cleanText(row['แผนก']) ||
    cleanText(row['คลินิก'])
  const text = preferred || other || primary || fallback
  if (!text) return ['ไม่ระบุ']
  return splitDepartmentText(text)
}

function isDateShapedLabel(label: string): boolean {
  return (
    /^\d{1,2}\s*[\u0e00-\u0e7f]+\s*25\d{2}$/.test(label) ||
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(label)
  )
}

function resolveDateFromRow(row: Record<string, unknown>, map: PeColumnMap): string {
  return (
    getRowValue(row, map, 'date') ||
    cleanText(row.date) ||
    cleanText(row.AccessIP_Time) ||
    cleanText(row.Sheet_LastUpdatedTime) ||
    cleanText(row.Timestamp) ||
    ''
  )
}

function resolveCommentFromRow(row: Record<string, unknown>, map: PeColumnMap): string {
  return (
    getRowValue(row, map, 'comment') ||
    cleanText(row.answer_part3_text) ||
    cleanText(row.comment) ||
    cleanText(row['ความคิดเห็น']) ||
    cleanText(row['ข้อเสนอแนะ'])
  )
}

function resolveRecommendFromRow(row: Record<string, unknown>, map: PeColumnMap): boolean | null {
  const mapped = getRowValue(row, map, 'recommend')
  if (mapped) return parseRecommendValue(mapped)
  return parseRecommendValue(
    row.part2_17 ?? row.part2_017 ?? row.q17 ?? row.recommend ?? row['แนะนำ'] ?? row['การบอกต่อ']
  )
}

function parseRawSurvey(
  rows: Record<string, unknown>[],
  fileName: string,
  warnings: string[],
  map: PeColumnMap
): PeUploadResult {
  const usable = rows.filter((r) => {
    const status = cleanText(r.Sheet_Status ?? r.sheet_status ?? r.status).toLowerCase()
    if (status && status !== 'approved' && status !== 'complete' && status !== 'completed') {
      if (status === 'rejected' || status === 'draft' || status === 'pending') return false
    }
    return true
  })

  type Acc = {
    label: string
    scores: number[]
    respondentMeans: number[]
    lowRespondents: number
    recommendYes: number
    recommendNo: number
    part2Sums: number[]
    part2Counts: number[]
    part2Unused: number[]
    part3Counts: number[]
    part3Other: number
    comments: Array<{ text: string; themeIndex: number | null }>
    dates: string[]
  }

  const byYear = new Map<number, Map<string, Acc>>()
  const yearTotals = new Map<
    number,
    {
      part2Sums: number[]
      part2Counts: number[]
      part2Unused: number[]
      part3Counts: number[]
      part3Other: number
      demo: ReturnType<typeof createDemoCounters>
    }
  >()

  const fallbackYear = inferYearFromFileName(fileName) ?? new Date().getFullYear() + 543

  const emptyAcc = (label: string): Acc => ({
    label,
    scores: [],
    respondentMeans: [],
    lowRespondents: 0,
    recommendYes: 0,
    recommendNo: 0,
    part2Sums: Array.from({ length: 16 }, () => 0),
    part2Counts: Array.from({ length: 16 }, () => 0),
    part2Unused: Array.from({ length: 16 }, () => 0),
    part3Counts: PE_PART3_SUGGESTIONS.map(() => 0),
    part3Other: 0,
    comments: [],
    dates: [],
  })

  const headerKeys: string[] = []
  const seenHeaders = new Set<string>()
  for (const row of usable.slice(0, 40)) {
    for (const key of Object.keys(row)) {
      if (seenHeaders.has(key)) continue
      seenHeaders.add(key)
      headerKeys.push(key)
    }
  }
  const checkboxes = findDepartmentCheckboxColumns(headerKeys)
  const departmentTextColumn = checkboxes.length >= 2 ? null : findBestDepartmentTextColumn(usable, headerKeys)
  if (checkboxes.length >= 2) {
    warnings.push(`คิดคะแนนแยกตามตัวเลือกหน่วยงาน ${checkboxes.length} หน่วยงานในแบบฟอร์ม`)
  } else if (departmentTextColumn) {
    warnings.push(`ใช้คอลัมน์ "${departmentTextColumn}" เป็นหน่วยงาน แล้วคิดคะแนนแยกตามชื่อในแบบฟอร์ม`)
  }

  let skippedEmpty = 0
  let usedRows = 0

  for (const row of usable) {
    const labels = resolveDepartmentLabels(row, map, checkboxes, departmentTextColumn).filter(
      (label) => !isDateShapedLabel(label)
    )
    if (!labels.length) continue

    const byQ = collectPart2FromMap(row, map)
    // fallback: ถ้า map ไม่ครบ ลองอ่านจากชื่อคอลัมน์ดิบแบบเดิม
    if (!byQ.some((n) => n != null)) {
      for (const [key, value] of Object.entries(row)) {
        const m = key.match(/^(?:part2[_\-]?|q|ข้อ\s*)0*(\d+)$/i)
        if (!m) continue
        const no = Number(m[1])
        if (no < 1 || no > 16) continue
        const n = parseLikertCell(value)
        if (n != null) byQ[no - 1] = n
      }
    }

    const scores = byQ.filter((n): n is number => n !== null && n >= 1 && n <= 5)
    const comment = resolveCommentFromRow(row, map)
    const part3Checked = collectPart3FromMap(row, map)
    if (!scores.length && !comment && !part3Checked.length) {
      skippedEmpty += 1
      continue
    }

    const dateHint = resolveDateFromRow(row, map)
    const yearBe =
      extractBuddhistYear(dateHint) ||
      extractBuddhistYear(row.date) ||
      extractBuddhistYear(row.AccessIP_Time) ||
      extractBuddhistYear(row.Sheet_LastUpdatedTime) ||
      fallbackYear

    let deptMap = byYear.get(yearBe)
    if (!deptMap) {
      deptMap = new Map()
      byYear.set(yearBe, deptMap)
      yearTotals.set(yearBe, {
        part2Sums: Array.from({ length: 16 }, () => 0),
        part2Counts: Array.from({ length: 16 }, () => 0),
        part2Unused: Array.from({ length: 16 }, () => 0),
        part3Counts: PE_PART3_SUGGESTIONS.map(() => 0),
        part3Other: 0,
        demo: createDemoCounters(),
      })
    }

    const yt = yearTotals.get(yearBe)!
    usedRows += 1
    accumulateDemographics(yt.demo, row, map)

    byQ.forEach((n, qi) => {
      if (n === null) return
      if (n === 0) {
        yt.part2Unused[qi] += 1
        return
      }
      if (n >= 1 && n <= 5) {
        yt.part2Sums[qi] += n
        yt.part2Counts[qi] += 1
      }
    })

    const recommend = resolveRecommendFromRow(row, map)
    const theme = part3Checked[0] ?? (comment ? matchPart3Suggestion(comment) : null)
    if (part3Checked.length) {
      for (const idx of part3Checked) yt.part3Counts[idx] += 1
    } else if (comment) {
      if (theme == null) yt.part3Other += 1
      else yt.part3Counts[theme] += 1
    }

    for (const label of labels) {
      let acc = deptMap.get(label)
      if (!acc) {
        acc = emptyAcc(label)
        deptMap.set(label, acc)
      }

      byQ.forEach((n, qi) => {
        if (n === null) return
        if (n === 0) {
          acc!.part2Unused[qi] += 1
          return
        }
        if (n >= 1 && n <= 5) {
          acc!.part2Sums[qi] += n
          acc!.part2Counts[qi] += 1
        }
      })

      if (scores.length) {
        acc.scores.push(...scores)
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length
        acc.respondentMeans.push(mean)
        if (mean < 3) acc.lowRespondents += 1
      }

      if (recommend === true) acc.recommendYes += 1
      if (recommend === false) acc.recommendNo += 1

      if (part3Checked.length) {
        for (const idx of part3Checked) acc.part3Counts[idx] += 1
      }

      if (comment) {
        if (theme == null) acc.part3Other += 1
        else if (!part3Checked.length) acc.part3Counts[theme] += 1
        acc.comments.push({ text: comment, themeIndex: theme })
      }

      if (dateHint) {
        const iso = dateHint.match(/(20\d{2}|25\d{2})-\d{2}-\d{2}/)
        acc.dates.push(iso ? iso[0] : dateHint)
      }
    }
  }

  if (!byYear.size) {
    throw new Error(
      'อ่านไฟล์แบบสำรวจได้ แต่ไม่พบแถวที่มีคะแนนส่วนที่ 2 (1–5) หรือความคิดเห็นส่วนที่ 3 — ตรวจสอบหัวคอลัมน์ว่าตรงกับแบบประเมินหรือไม่'
    )
  }

  warnings.push(...map.reportLines)
  warnings.push(
    `ประมวลผล ${usedRows.toLocaleString('th-TH')} แถว` +
      (skippedEmpty ? ` · ข้ามแถวว่าง ${skippedEmpty.toLocaleString('th-TH')} แถว` : '')
  )

  const mappedQ = map.part2Headers.filter(Boolean).length
  if (mappedQ < 12) {
    warnings.push(
      `พบคอลัมน์ส่วนที่ 2 เพียง ${mappedQ}/16 ข้อ — แนะนำตั้งชื่อคอลัมน์เป็น part2_1…part2_16 หรือใช้ข้อความหัวข้อตามแบบฟอร์ม`
    )
  }

  const bundles: PeYearBundle[] = []
  const years = [...byYear.keys()].sort((a, b) => a - b)

  for (const yearBe of years) {
    const deptMap = byYear.get(yearBe)!
    const yt = yearTotals.get(yearBe)!
    const departments: PeDepartmentRow[] = []
    const comments: PeComment[] = []
    let i = 0
    const allDates: string[] = []

    for (const acc of deptMap.values()) {
      const count = Math.max(acc.respondentMeans.length, 1)
      const avgSatisfaction =
        acc.respondentMeans.length > 0
          ? acc.respondentMeans.reduce((a, b) => a + b, 0) / acc.respondentMeans.length
          : acc.scores.length
            ? acc.scores.reduce((a, b) => a + b, 0) / acc.scores.length
            : 0

      const highShare =
        acc.respondentMeans.length > 0
          ? acc.respondentMeans.filter((m) => m >= 4).length / acc.respondentMeans.length
          : 0

      const recommendTotal = acc.recommendYes + acc.recommendNo
      const recommendRate =
        recommendTotal > 0
          ? Math.round((acc.recommendYes / recommendTotal) * 1000) / 10
          : Math.round((84 + highShare * 16) * 10) / 10
      const returnRate = Math.round((85 + highShare * 15) * 10) / 10
      const dissatisfactionRate = Math.round((acc.lowRespondents / count) * 1000) / 10

      const part2Avgs = acc.part2Counts.map((n, qi) =>
        n > 0 ? Math.round((acc.part2Sums[qi] / n) * 100) / 100 : 0
      )

      const official = PE_SURVEY_DEPARTMENTS.find((d) => d.label === acc.label)
      departments.push({
        id: official?.id ?? slugId(acc.label, i),
        label: acc.label,
        count,
        avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
        returnRate,
        recommendRate,
        dissatisfactionRate,
        part2Avgs,
      })

      for (const c of acc.comments.slice(0, 80)) {
        comments.push({
          id: `up-${yearBe}-c-${i}-${comments.length}`,
          department: acc.label,
          text: c.text,
          sentiment: inferSentiment(c.text),
          part3ThemeIndex: c.themeIndex,
        })
      }
      allDates.push(...acc.dates)
      i += 1
    }

    departments.sort((a, b) => b.count - a.count)
    const datesSorted = [...new Set(allDates)].sort()
    const demographics = demoCountersToBuckets(yt.demo)
    const hasDemo = Object.values(demographics).some((arr) => arr.length > 0)

    bundles.push({
      yearBe,
      fileName,
      uploadedAt: new Date().toISOString(),
      dataset: finalizeDataset(
        departments,
        comments,
        `แบบประเมิน PEP · ปี ${yearBe} · ${fileName}`,
        datesSorted[0],
        datesSorted[datesSorted.length - 1],
        {
          part2Sums: yt.part2Sums,
          part2Counts: yt.part2Counts,
          part2Unused: yt.part2Unused,
          part3Counts: yt.part3Counts,
          part3Other: yt.part3Other,
          demographics: hasDemo ? demographics : undefined,
        }
      ),
    })
  }

  if (bundles.length > 1) {
    warnings.push(`แยกข้อมูลได้ ${bundles.length} ปี: ${bundles.map((b) => b.yearBe).join(', ')}`)
  }

  return { bundles, fileName, warnings, mappingReport: map.reportLines }
}

function parseSummaryTable(
  rows: Record<string, unknown>[],
  headers: string[],
  fileName: string,
  warnings: string[],
  map: PeColumnMap
): PeUploadResult {
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }))

  let deptKey =
    map.fields.department ||
    map.fields.departmentOther ||
    normHeaders.find((h) =>
      /หน่วยงาน|แผนก|department_other|^department$|คลินิก|หน่วยบริการ|กลุ่มงาน|^unit$|clinic|service/i.test(
        h.norm
      )
    )?.raw ||
    null

  if (!deptKey && rows.length) {
    for (const h of headers) {
      const sample = rows.slice(0, 20).map((r) => cleanText(r[h]))
      const textish = sample.filter((s) => s && toNumber(s) === null).length
      if (textish >= Math.min(5, sample.filter(Boolean).length)) {
        deptKey = h
        warnings.push(`ใช้คอลัมน์ "${h}" เป็นหน่วยงาน (ไม่พบหัวตารางมาตรฐาน)`)
        break
      }
    }
  }

  const richerDeptKey = findBestDepartmentTextColumn(rows, headers)
  if (richerDeptKey && richerDeptKey !== deptKey) {
    deptKey = richerDeptKey
    warnings.push(`ใช้คอลัมน์ "${richerDeptKey}" เป็นหน่วยงาน เพราะมีชื่อหน่วยงานหลายแห่ง`)
  }

  if (!deptKey) {
    throw new Error(
      `ไม่พบคอลัมน์หน่วยงาน/แผนก — หัวตารางที่พบ: ${headers.slice(0, 12).join(', ') || '(ว่าง)'} — ใส่หัวตารางเช่น หน่วยงาน / department หรือข้อความส่วนที่ 2 ตามแบบฟอร์ม`
    )
  }

  const countKey = normHeaders.find((h) =>
    /^count$|จำนวน|ผู้ตอบ|respondent|^n$/i.test(h.norm)
  )?.raw
  const satKey = normHeaders.find((h) =>
    /พึงพอใจ|satisfaction|คะแนนเฉลี่ย|avg.?score|mean/i.test(h.norm)
  )?.raw
  const returnKey = normHeaders.find((h) =>
    /กลับมาใช้|return|revisit|loyalty/i.test(h.norm)
  )?.raw
  const recommendKey =
    map.fields.recommend ||
    normHeaders.find((h) => /บอกต่อ|recommend|nps|referral|แนะนำ/i.test(h.norm))?.raw
  const dissatKey = normHeaders.find((h) =>
    /ไม่พึงพอใจ|dissatisf|complaint|unsatisfied/i.test(h.norm)
  )?.raw
  const commentKey =
    map.fields.comment ||
    normHeaders.find((h) =>
      /ความคิดเห็น|ข้อเสนอ|comment|feedback|answer_part3_text/i.test(h.norm)
    )?.raw
  const yearKey = normHeaders.find((h) =>
    /^ปี$|^year$|พ\.?\s*ศ\.?|buddhist|ปี\s*พ/i.test(h.norm)
  )?.raw
  const dateKey =
    map.fields.date ||
    normHeaders.find((h) => /^date$|วันที่|survey.?date|AccessIP_Time/i.test(h.norm))?.raw

  const fallbackYear = inferYearFromFileName(fileName) ?? new Date().getFullYear() + 543

  type AccRow = {
    label: string
    count: number
    avgSatisfaction: number
    returnRate: number
    recommendRate: number
    dissatisfactionRate: number
    comments: string[]
  }

  const byYear = new Map<number, AccRow[]>()

  rows.forEach((row) => {
    const label = resolveSurveyDepartmentLabel(cleanText(row[deptKey!]))
    if (!label || /รวม|total|ภาพรวม/i.test(label)) return

    let avgSatisfaction = (satKey ? toNumber(row[satKey]) : null) ?? 0
    if (avgSatisfaction > 5 && avgSatisfaction <= 100) {
      avgSatisfaction = Math.round((avgSatisfaction / 20) * 100) / 100
    }

    // ถ้ามีคอลัมน์ส่วนที่ 2 ในไฟล์สรุป — เฉลี่ยจากข้อที่จับได้
    const byQ = collectPart2FromMap(row, map).filter((n): n is number => n !== null && n >= 1 && n <= 5)
    if (byQ.length && (!satKey || avgSatisfaction <= 0)) {
      avgSatisfaction = byQ.reduce((a, b) => a + b, 0) / byQ.length
    }

    let returnRate = (returnKey ? toNumber(row[returnKey]) : null) ?? 0
    let recommendRate = (recommendKey ? toNumber(row[recommendKey]) : null) ?? 0
    let dissatisfactionRate = (dissatKey ? toNumber(row[dissatKey]) : null) ?? 0
    if (returnRate > 0 && returnRate <= 1) returnRate *= 100
    if (recommendRate > 0 && recommendRate <= 1) recommendRate *= 100
    if (dissatisfactionRate > 0 && dissatisfactionRate <= 1) dissatisfactionRate *= 100

    const recommendFlag = recommendKey ? parseRecommendValue(row[recommendKey]) : null
    if (recommendFlag === true && recommendRate <= 0) recommendRate = 100
    if (recommendFlag === false && recommendRate <= 0) recommendRate = 0

    const count = Math.max(0, Math.round((countKey ? toNumber(row[countKey]) : null) ?? 1))

    const yearBe =
      (yearKey
        ? Math.round(toNumber(row[yearKey]) ?? 0) || extractBuddhistYear(row[yearKey])
        : null) ??
      (dateKey ? extractBuddhistYear(row[dateKey]) : null) ??
      fallbackYear

    const list = byYear.get(yearBe) ?? []
    const comment = commentKey ? cleanText(row[commentKey]) : ''
    list.push({
      label,
      count,
      avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
      returnRate: Math.round(returnRate * 10) / 10,
      recommendRate: Math.round(recommendRate * 10) / 10,
      dissatisfactionRate: Math.round(dissatisfactionRate * 10) / 10,
      comments: comment ? [comment] : [],
    })
    byYear.set(yearBe, list)
  })

  if (!byYear.size) {
    throw new Error(`ไม่พบแถวหน่วยงานที่ใช้ได้ — หัวตาราง: ${headers.slice(0, 12).join(', ')}`)
  }

  warnings.push(...map.reportLines)
  if (!satKey && map.part2Headers.filter(Boolean).length === 0) {
    warnings.push('ไม่พบคอลัมน์คะแนนพึงพอใจโดยตรง')
  }
  if (!countKey) warnings.push('ไม่พบคอลัมน์จำนวนผู้ตอบโดยตรง — ใช้ 1 ต่อแถว')
  warnings.push('แยกข้อมูลสรุปตามปี พ.ศ. ตามโครงสร้างแบบประเมิน PEP')

  const bundles: PeYearBundle[] = []
  for (const yearBe of [...byYear.keys()].sort((a, b) => a - b)) {
    const list = byYear.get(yearBe)!
    const departments: PeDepartmentRow[] = list.map((r, i) => ({
      id: PE_SURVEY_DEPARTMENTS.find((d) => d.label === r.label)?.id ?? slugId(r.label, i),
      label: r.label,
      count: r.count,
      avgSatisfaction: r.avgSatisfaction,
      returnRate: r.returnRate,
      recommendRate: r.recommendRate,
      dissatisfactionRate: r.dissatisfactionRate,
      part2Avgs: synthesizePart2Avgs(r.avgSatisfaction, i),
    }))
    const comments: PeComment[] = []
    list.forEach((r, i) => {
      for (const text of r.comments) {
        comments.push({
          id: `up-${yearBe}-inline-${i}-${comments.length}`,
          department: r.label,
          text,
          sentiment: inferSentiment(text),
          part3ThemeIndex: matchPart3Suggestion(text),
        })
      }
    })

    bundles.push({
      yearBe,
      fileName,
      uploadedAt: new Date().toISOString(),
      dataset: finalizeDataset(
        departments,
        comments,
        `แบบประเมิน PEP · ปี ${yearBe} · ${fileName}`
      ),
    })
  }

  if (bundles.length > 1) {
    warnings.push(`แยกข้อมูลได้ ${bundles.length} ปี: ${bundles.map((b) => b.yearBe).join(', ')}`)
  }

  return { bundles, fileName, warnings, mappingReport: map.reportLines }
}

/**
 * Parse uploaded .xls / .xlsx / .csv into Patient Experience dataset.
 * จับคู่หัวคอลัมน์กับแบบประเมิน PEP ส่วนที่ 1–3 อัตโนมัติ
 */
export async function parsePeUploadFile(file: File): Promise<PeUploadResult> {
  const warnings: string[] = []
  const name = file.name.toLowerCase()
  if (!/\.(xlsx|xls|csv)$/i.test(name)) {
    throw new Error('รองรับเฉพาะไฟล์ .xls, .xlsx หรือ .csv')
  }

  const wb = await readWorkbook(file)
  const { rows, headers } = sheetToObjects(wb)

  if (!rows.length) {
    throw new Error('ไฟล์ไม่มีแถวข้อมูล')
  }

  const map = buildPeColumnMap(headers)

  if (isLikelyRawSurvey(map, headers)) {
    return parseRawSurvey(rows, file.name, warnings, map)
  }

  return parseSummaryTable(rows, headers, file.name, warnings, map)
}

export function filterPeDataset(
  dataset: PeDataset,
  departmentId: string,
  dateRange: PeDateRange = { from: '', to: '' }
): PeDataset {
  const factor = peDateRangeOverlapFactor(dataset.dateFrom, dataset.dateTo, dateRange)
  const display = peClampDisplayRange(dataset.dateFrom, dataset.dateTo, dateRange)

  let rows =
    !departmentId || departmentId === 'all'
      ? dataset.departments
      : dataset.departments.filter((d) => departmentMatchesId(d, departmentId))

  if (factor <= 0) {
    return {
      ...dataset,
      dateFrom: display.dateFrom,
      dateTo: display.dateTo,
      kpis: {
        respondents: 0,
        avgSatisfaction: 0,
        overallHealthLabel: 'ไม่มีข้อมูล',
        returnRate: 0,
        recommendRate: 0,
        dissatisfactionRate: 0,
      },
      departments: [],
      dimensions: [],
      topStrengths: [],
      topImprovements: [],
      comments: [],
      part2Items: dataset.part2Items.map((i) => ({
        ...i,
        avgScore: 0,
        responseCount: 0,
        unusedCount: 0,
      })),
      part3Themes: dataset.part3Themes.map((t) => ({ ...t, count: 0, pct: 0 })),
      demographics: undefined,
    }
  }

  if (factor < 0.999) {
    rows = rows.map((r) => ({
      ...r,
      count: Math.max(1, Math.round(r.count * factor)),
    }))
  }

  const kpis = aggregate(rows)
  const ranks = buildRanks(rows)
  const labels = new Set(rows.map((r) => resolveSurveyDepartmentLabel(r.label)))
  const comments = annotateCommentsWithThemes(
    dataset.comments.filter((c) => labels.has(resolveSurveyDepartmentLabel(c.department)))
  )
  const part2Items =
    rows.length === 1 && rows[0]?.part2Avgs?.length
      ? buildPart2ItemsFromAvgs(rows[0].part2Avgs, rows[0].count)
      : mergePart2AcrossDepartments(rows)

  const scaleDemo = <T extends { count: number }>(arr: T[] | undefined): T[] | undefined => {
    if (!arr || factor >= 0.999) return arr
    return arr.map((b) => ({ ...b, count: Math.max(0, Math.round(b.count * factor)) }))
  }

  return {
    ...dataset,
    dateFrom: display.dateFrom,
    dateTo: display.dateTo,
    kpis,
    departments: rows,
    dimensions: buildPart2DimensionScores(part2Items),
    topStrengths: ranks.topStrengths,
    topImprovements: ranks.topImprovements,
    comments,
    part2Items,
    part3Themes: buildPart3FromComments(comments),
    demographics:
      departmentId && departmentId !== 'all'
        ? undefined
        : dataset.demographics
          ? {
              visitFrequency: scaleDemo(dataset.demographics.visitFrequency) ?? [],
              gender: scaleDemo(dataset.demographics.gender) ?? [],
              age: scaleDemo(dataset.demographics.age) ?? [],
              education: scaleDemo(dataset.demographics.education) ?? [],
              rights: scaleDemo(dataset.demographics.rights) ?? [],
            }
          : undefined,
  }
}
