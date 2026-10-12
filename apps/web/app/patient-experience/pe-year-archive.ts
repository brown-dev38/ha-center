import type { PeDataset } from '@/app/patient-experience/pe-types'

export type PeUploadScope = 'month' | 'year'

/** What the user confirmed before the file was stored */
export type PeUploadReceipt = {
  scope: PeUploadScope
  yearBe: number
  /** 1–12 when scope is month */
  month: number | null
  version: number
  /** Local calendar date of the confirmation, YYYY-MM-DD */
  uploadedOn: string
}

/** พ.ศ. year archive entry for Patient Experience uploads */
export type PeYearBundle = {
  yearBe: number
  fileName: string
  uploadedAt: string
  dataset: PeDataset
  slotId?: string
  period?: PeUploadReceipt
}

export type PeYearArchive = Record<string, PeYearBundle>

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const

const STORAGE_KEY = 'ha-pe-year-archive-v1'

function isBundle(value: unknown): value is PeYearBundle {
  if (!value || typeof value !== 'object') return false
  const row = value as PeYearBundle
  return Number.isFinite(Number(row.yearBe)) && !!row.dataset
}

/** Older archives were keyed by พ.ศ. year only. Keep them as yearly slots. */
export function normalizePeYearArchive(parsed: unknown): PeYearArchive {
  if (!parsed || typeof parsed !== 'object') return {}
  const next: PeYearArchive = {}
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isBundle(value)) continue
    const yearBe = Number(value.yearBe)
    const slotId =
      typeof value.slotId === 'string' && value.slotId
        ? value.slotId
        : /^\d+$/.test(key)
          ? `Y${key}`
          : key
    const period: PeUploadReceipt = value.period ?? {
      scope: 'year',
      yearBe,
      month: null,
      version: 1,
      uploadedOn: String(value.uploadedAt || '').slice(0, 10),
    }
    next[slotId] = { ...value, yearBe, slotId, period }
  }
  return next
}

export function loadPeYearArchive(): PeYearArchive {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return normalizePeYearArchive(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function savePeYearArchive(archive: PeYearArchive) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(archive))
}

export function slotIdFor(receipt: Pick<PeUploadReceipt, 'scope' | 'yearBe' | 'month'>): string {
  if (receipt.scope === 'month' && receipt.month) {
    return `M${receipt.yearBe}-${String(receipt.month).padStart(2, '0')}`
  }
  return `Y${receipt.yearBe}`
}

export function nextUploadVersion(archive: PeYearArchive, slotId: string): number {
  return (archive[slotId]?.period?.version ?? 0) + 1
}

export function currentBuddhistYear(now = new Date()): number {
  return now.getFullYear() + 543
}

export function localTodayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatThaiLongDate(value: string | Date): string {
  const date =
    typeof value === 'string'
      ? new Date(value.length <= 10 ? `${value}T00:00:00` : value)
      : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatPeriodLabel(receipt: Pick<PeUploadReceipt, 'scope' | 'yearBe' | 'month'>): string {
  if (receipt.scope === 'month' && receipt.month) {
    const name = THAI_MONTHS[receipt.month - 1] ?? `เดือน ${receipt.month}`
    return `${name} ${receipt.yearBe}`
  }
  return `รายปี พ.ศ. ${receipt.yearBe}`
}

export function formatSlotLabel(bundle: PeYearBundle): string {
  if (bundle.period) return formatPeriodLabel(bundle.period)
  return `รายปี พ.ศ. ${bundle.yearBe}`
}

const MONTH_TOKENS: Array<[string, number]> = [
  ['มกราคม', 1],
  ['กุมภาพันธ์', 2],
  ['มีนาคม', 3],
  ['เมษายน', 4],
  ['พฤษภาคม', 5],
  ['มิถุนายน', 6],
  ['กรกฎาคม', 7],
  ['สิงหาคม', 8],
  ['กันยายน', 9],
  ['ตุลาคม', 10],
  ['พฤศจิกายน', 11],
  ['ธันวาคม', 12],
  ['ม.ค.', 1],
  ['ก.พ.', 2],
  ['มี.ค.', 3],
  ['เม.ย.', 4],
  ['พ.ค.', 5],
  ['มิ.ย.', 6],
  ['ก.ค.', 7],
  ['ส.ค.', 8],
  ['ก.ย.', 9],
  ['ต.ค.', 10],
  ['พ.ย.', 11],
  ['ธ.ค.', 12],
]

export function inferMonthFromFileName(fileName: string): number | null {
  const compact = fileName.replace(/\s+/g, '')
  const ordered = [...MONTH_TOKENS].sort((a, b) => b[0].length - a[0].length)
  for (const [token, month] of ordered) {
    if (compact.includes(token.replace(/\s+/g, ''))) return month
  }
  return null
}

function monthBounds(yearBe: number, month: number): { dateFrom: string; dateTo: string } {
  const ce = yearBe - 543
  const from = new Date(Date.UTC(ce, month - 1, 1))
  const to = new Date(Date.UTC(ce, month, 0))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { dateFrom: iso(from), dateTo: iso(to) }
}

export function buildConfirmedBundle(
  bundles: PeYearBundle[],
  receipt: PeUploadReceipt
): { bundle: PeYearBundle; slotId: string } {
  const match = bundles.find((bundle) => bundle.yearBe === receipt.yearBe) ?? bundles[0]
  if (!match) {
    throw new Error('ไม่พบข้อมูลในไฟล์')
  }
  const slotId = slotIdFor(receipt)
  const label = formatPeriodLabel(receipt)
  const range =
    receipt.scope === 'month' && receipt.month ? monthBounds(receipt.yearBe, receipt.month) : null
  const bundle: PeYearBundle = {
    ...match,
    yearBe: receipt.yearBe,
    uploadedAt: new Date().toISOString(),
    slotId,
    period: receipt,
    dataset: {
      ...match.dataset,
      ...(range ?? {}),
      sourceLabel: `แบบประเมิน PEP · ${label} · เวอร์ชัน ${receipt.version}`,
    },
  }
  return { bundle, slotId }
}

/** Keep the newer upload when the same slot exists on two machines. */
export function mergePeArchives(
  local: PeYearArchive,
  remote: PeYearArchive
): { archive: PeYearArchive; localNewer: PeYearBundle[] } {
  const archive: PeYearArchive = { ...remote }
  const localNewer: PeYearBundle[] = []
  for (const [slotId, localBundle] of Object.entries(local)) {
    const remoteBundle = remote[slotId]
    const localTime = Date.parse(localBundle.uploadedAt || '') || 0
    const remoteTime = remoteBundle ? Date.parse(remoteBundle.uploadedAt || '') || 0 : -1
    if (!remoteBundle || localTime > remoteTime) {
      archive[slotId] = localBundle
      localNewer.push(localBundle)
    }
  }
  return { archive, localNewer }
}

export function saveConfirmedUpload(
  archive: PeYearArchive,
  bundles: PeYearBundle[],
  receipt: PeUploadReceipt
): { archive: PeYearArchive; slotId: string } {
  const { bundle, slotId } = buildConfirmedBundle(bundles, receipt)
  const next = { ...archive, [slotId]: bundle }
  savePeYearArchive(next)
  return { archive: next, slotId }
}

export function upsertYearBundles(
  archive: PeYearArchive,
  bundles: PeYearBundle[]
): PeYearArchive {
  const next = { ...archive }
  for (const bundle of bundles) {
    const slotId = bundle.slotId || `Y${bundle.yearBe}`
    next[slotId] = { ...bundle, slotId }
  }
  savePeYearArchive(next)
  return next
}

export function removeSlotFromArchive(archive: PeYearArchive, slotId: string): PeYearArchive {
  const next = { ...archive }
  delete next[slotId]
  savePeYearArchive(next)
  return next
}

export function removeYearFromArchive(archive: PeYearArchive, yearBe: number): PeYearArchive {
  return removeSlotFromArchive(archive, `Y${yearBe}`)
}

export function clearPeYearArchive(): PeYearArchive {
  savePeYearArchive({})
  return {}
}

export function listArchiveSlots(archive: PeYearArchive): string[] {
  return Object.keys(archive).sort((a, b) => {
    const left = archive[a]
    const right = archive[b]
    if (!left || !right) return 0
    if (left.yearBe !== right.yearBe) return right.yearBe - left.yearBe
    const leftMonth = left.period?.scope === 'month' ? (left.period.month ?? 99) : 0
    const rightMonth = right.period?.scope === 'month' ? (right.period.month ?? 99) : 0
    return leftMonth - rightMonth
  })
}

/** One row per พ.ศ. year for the year-over-year chart. Yearly uploads win over a single month. */
export function bundlesForYearComparison(archive: PeYearArchive): PeYearBundle[] {
  const byYear = new Map<number, PeYearBundle>()
  for (const bundle of Object.values(archive)) {
    const prev = byYear.get(bundle.yearBe)
    const rank = (row: PeYearBundle) => (row.period?.scope === 'month' ? 1 : 2)
    if (
      !prev ||
      rank(bundle) > rank(prev) ||
      (rank(bundle) === rank(prev) && bundle.uploadedAt > prev.uploadedAt)
    ) {
      byYear.set(bundle.yearBe, bundle)
    }
  }
  return [...byYear.values()].sort((a, b) => a.yearBe - b.yearBe)
}

export function listArchiveYears(archive: PeYearArchive): number[] {
  return [...new Set(Object.values(archive).map((bundle) => bundle.yearBe))]
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a)
}

/** Extract Buddhist Era year from mixed date formats */
export function extractBuddhistYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial ≈ days since 1899-12-30
    if (value > 20000 && value < 80000) {
      const utc = Date.UTC(1899, 11, 30) + value * 86400000
      const y = new Date(utc).getUTCFullYear()
      return y > 2400 ? y : y + 543
    }
    if (value >= 2500 && value <= 2700) return Math.round(value)
    if (value >= 2000 && value <= 2100) return Math.round(value) + 543
  }

  const s = String(value).replace(/\u00a0/g, ' ').trim()

  // ISO / AccessIP: 2026-08-13 ...
  const iso = s.match(/(20\d{2}|25\d{2}|26\d{2})/)
  if (iso) {
    const y = Number(iso[1])
    return y > 2400 ? y : y + 543
  }

  // dd/mm/yyyy or mm/dd/yyyy with BE or CE
  const slash = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
  if (slash) {
    const y = Number(slash[3])
    return y > 2400 ? y : y + 543
  }

  // Thai month text e.g. 18 มีนาคม 2569
  const thai = s.match(/(25\d{2}|26\d{2}|20\d{2})/)
  if (thai) {
    const y = Number(thai[1])
    return y > 2400 ? y : y + 543
  }

  return null
}

export function inferYearFromFileName(fileName: string): number | null {
  const be = fileName.match(/(25\d{2}|26\d{2})/)
  if (be) return Number(be[1])
  const ce = fileName.match(/(20\d{2})/)
  if (ce) return Number(ce[1]) + 543
  return null
}
