import { HSCS_SECTION_TITLES } from '@/app/hscs/server/hscs-analytics-types'
import type {
  HscsCleanRating,
  HscsQuestionMeta,
} from '@/app/hscs/server/hscs-analytics-types'

/** Normalize IDs / labels: trim, remove NBSP (\xa0), collapse spaces */
export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Parse Likert 1–5; exclude 0, blank, non-numeric → null */
export function parseLikert(value: unknown): HscsCleanRating {
  if (value === null || value === undefined || value === '') return null
  const raw = cleanText(value)
  if (!raw || raw === '-' || raw === 'N/A' || raw === 'n/a') return null
  const n = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n)) return null
  if (n === 0) return null
  if (n < 1 || n > 5) return null
  return n
}

export function isPositiveLikert(rating: HscsCleanRating): boolean {
  return rating !== null && rating >= 4
}

export function mean(values: number[]): number | null {
  if (!values.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function positivePct(ratings: HscsCleanRating[]): number | null {
  const valid = ratings.filter((r): r is number => r !== null)
  if (!valid.length) return null
  const pos = valid.filter((r) => r >= 4).length
  return (pos / valid.length) * 100
}

export function sectionTitle(section: string): string {
  return HSCS_SECTION_TITLES[section] ?? `Section ${section}`
}

const SECTION_RE = /^([A-Ha-h])[\s.\-_]*(\d+)?/

/** Infer section letter + optional item number from header cell */
export function inferSectionCode(header: string, fallbackIndex: number): { section: string; code: string } {
  const h = cleanText(header)
  const m = h.match(SECTION_RE)
  if (m) {
    const section = m[1].toUpperCase()
    const num = m[2] ?? String(fallbackIndex + 1)
    return { section, code: `${section}${num}` }
  }
  // Category row may be long Thai titles — map by keywords
  const lower = h.toLowerCase()
  if (/ทีม|teamwork/.test(h)) return { section: 'A', code: `A${fallbackIndex + 1}` }
  if (/บุคลากร|พื้นที่|staffing|work.?area/.test(h)) return { section: 'B', code: `B${fallbackIndex + 1}` }
  if (/เรียนรู้|learning/.test(h)) return { section: 'C', code: `C${fallbackIndex + 1}` }
  if (/ตอบสนอง|ความคลาดเคลื่อน|error.?response|non.?punitive/.test(h))
    return { section: 'D', code: `D${fallbackIndex + 1}` }
  if (/หัวหน้า|supervisor|manager|grade|เกรด|ความปลอดภัยโดยรวม/.test(h))
    return { section: 'E', code: `E${fallbackIndex + 1}` }
  if (/สื่อสาร.*คลาด|feedback|communication.?error/.test(h))
    return { section: 'F', code: `F${fallbackIndex + 1}` }
  if (/รายงาน|frequency|event.?report|ความถี่/.test(h))
    return { section: 'G', code: `G${fallbackIndex + 1}` }
  if (/ข้อเสนอ|comment|suggestion|ความคิดเห็น|open.?text|อื่นๆ/.test(h) || lower.includes('h.'))
    return { section: 'H', code: `H${fallbackIndex + 1}` }
  return { section: 'X', code: `X${fallbackIndex + 1}` }
}

export function classifyQuestionKind(
  section: string,
  header: string
): HscsQuestionMeta['kind'] {
  const h = cleanText(header)
  if (section === 'H' || /ข้อเสนอ|ความคิดเห็น|suggestion|comment|text/i.test(h)) return 'text'
  if (section === 'E' && /grade|เกรด|คะแนนรวม|overall.?safety/i.test(h)) return 'safety_grade'
  if (section === 'G' || /ความถี่|frequency|how.?often|รายงานเหตุการณ์/i.test(h)) return 'frequency'
  if (/^[A-GD]/i.test(section) || section === 'E') return 'likert'
  return 'unknown'
}

export function excelSerialToIso(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const n = Number(value)
  if (Number.isFinite(n) && n > 20000 && n < 80000) {
    // Excel serial date (days since 1899-12-30)
    const utc = Date.UTC(1899, 11, 30) + n * 86400000
    return new Date(utc).toISOString().slice(0, 10)
  }
  const s = cleanText(value)
  const parsed = Date.parse(s)
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10)
  // Thai Buddhist year e.g. 15/08/2569
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (m) {
    let y = Number(m[3])
    if (y > 2400) y -= 543
    const iso = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    if (!Number.isNaN(Date.parse(iso))) return iso
  }
  return null
}
