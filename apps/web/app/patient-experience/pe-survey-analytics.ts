import {
  PE_PART2_DIMENSION_GROUPS,
  PE_PART2_QUESTIONS,
  PE_PART2_SHORT_LABELS,
  PE_PART3_SHORT_LABELS,
  PE_PART3_SUGGESTIONS,
  resolvePart3ThemeIndex,
  sharePercents,
  summarizePart3Themes,
} from '@/app/patient-experience/pe-survey-form-content'
import type {
  PeComment,
  PeDemographics,
  PeDimensionScore,
  PePart2ItemScore,
  PePart3ThemeStat,
} from '@/app/patient-experience/pe-types'

/** คะแนนเฉลี่ยเต็ม 5 คิดเป็นเปอร์เซ็นต์ของคะแนนเต็ม ทศนิยม 1 ตำแหน่ง */
export function satisfactionPercent(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0
  const clamped = Math.min(score, 5)
  return Math.round((clamped / 5) * 1000) / 10
}

export function formatSatisfactionPercent(score: number): string {
  return `${satisfactionPercent(score).toFixed(1)}%`
}

export function emptyPart2Items(): PePart2ItemScore[] {
  return PE_PART2_QUESTIONS.map((label, i) => ({
    questionNo: i + 1,
    label,
    shortLabel: PE_PART2_SHORT_LABELS[i] ?? `ข้อ ${i + 1}`,
    avgScore: 0,
    responseCount: 0,
    unusedCount: 0,
  }))
}

export function buildPart2ItemsFromAvgs(
  avgs: number[],
  responseCount: number,
  unusedPerQ: number[] = []
): PePart2ItemScore[] {
  return PE_PART2_QUESTIONS.map((label, i) => ({
    questionNo: i + 1,
    label,
    shortLabel: PE_PART2_SHORT_LABELS[i] ?? `ข้อ ${i + 1}`,
    avgScore: Math.round((avgs[i] ?? 0) * 100) / 100,
    responseCount,
    unusedCount: unusedPerQ[i] ?? 0,
  }))
}

/** สร้างคะแนนรายข้อรอบ ๆ ค่าเฉลี่ยรวม (สำหรับข้อมูลตัวอย่าง / สรุปไม่มีรายข้อ) */
export function synthesizePart2Avgs(avgSatisfaction: number, seed = 0): number[] {
  const wobble = [0.08, 0.04, 0.06, -0.02, 0.01, 0.03, 0.05, -0.05, 0.07, -0.01, 0.02, 0.04, -0.03, 0, 0.01, 0.06]
  return PE_PART2_QUESTIONS.map((_, i) => {
    const v = avgSatisfaction + wobble[(i + seed) % wobble.length]
    return Math.round(Math.min(5, Math.max(1, v)) * 100) / 100
  })
}

export function buildPart2ItemsFromSums(
  sums: number[],
  counts: number[],
  unused: number[]
): PePart2ItemScore[] {
  return PE_PART2_QUESTIONS.map((label, i) => {
    const n = counts[i] ?? 0
    const avg = n > 0 ? (sums[i] ?? 0) / n : 0
    return {
      questionNo: i + 1,
      label,
      shortLabel: PE_PART2_SHORT_LABELS[i] ?? `ข้อ ${i + 1}`,
      avgScore: Math.round(avg * 100) / 100,
      responseCount: n,
      unusedCount: unused[i] ?? 0,
    }
  })
}

export function buildPart3ThemeStats(
  counts: number[],
  other: number
): PePart3ThemeStat[] {
  const values = [...counts.slice(0, PE_PART3_SUGGESTIONS.length), other]
  const pcts = sharePercents(values)
  const themes = PE_PART3_SUGGESTIONS.map((label, i) => ({
    themeIndex: i,
    label,
    shortLabel: PE_PART3_SHORT_LABELS[i] ?? `ด้าน ${i + 1}`,
    count: counts[i] ?? 0,
    pct: pcts[i] ?? 0,
  }))
  themes.push({
    themeIndex: -1,
    label: 'อื่น ๆ โปรดระบุ',
    shortLabel: 'อื่น ๆ',
    count: other,
    pct: pcts[pcts.length - 1] ?? 0,
  })
  return themes
}

export function buildPart3FromComments(comments: PeComment[]): PePart3ThemeStat[] {
  const { counts, other } = summarizePart3Themes(comments)
  return buildPart3ThemeStats(counts, other)
}

export function annotateCommentsWithThemes(comments: PeComment[]): PeComment[] {
  return comments.map((c) => ({
    ...c,
    part3ThemeIndex: resolvePart3ThemeIndex(c),
  }))
}

/** มิติ Radar จากกลุ่มข้อส่วนที่ 2 (คะแนน 0–100) */
export function buildPart2DimensionScores(items: PePart2ItemScore[]): PeDimensionScore[] {
  return PE_PART2_DIMENSION_GROUPS.map((g) => {
    const selected = g.questionNos
      .map((n) => items.find((it) => it.questionNo === n))
      .filter((it): it is PePart2ItemScore => Boolean(it && it.responseCount > 0))
    const avg =
      selected.length > 0
        ? selected.reduce((s, it) => s + it.avgScore, 0) / selected.length
        : 0
    return {
      id: g.id,
      label: g.label,
      score: Math.round((avg / 5) * 1000) / 10,
      max: 100,
    }
  })
}

export function emptyDemographics(): PeDemographics {
  return {
    visitFrequency: [],
    gender: [],
    age: [],
    education: [],
    rights: [],
  }
}

export function mergePart2AcrossDepartments(
  rows: { count: number; part2Avgs?: number[] }[]
): PePart2ItemScore[] {
  const sums = PE_PART2_QUESTIONS.map(() => 0)
  const counts = PE_PART2_QUESTIONS.map(() => 0)
  for (const row of rows) {
    if (!row.part2Avgs?.length) continue
    for (let i = 0; i < 16; i++) {
      const v = row.part2Avgs[i]
      if (v == null || v <= 0) continue
      sums[i] += v * row.count
      counts[i] += row.count
    }
  }
  const hasAny = counts.some((n) => n > 0)
  if (!hasAny) return emptyPart2Items()
  return buildPart2ItemsFromSums(sums, counts, PE_PART2_QUESTIONS.map(() => 0))
}
