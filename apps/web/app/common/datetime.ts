const TH_TZ = 'Asia/Bangkok'

const DATE_LONG_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: TH_TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}

const DATE_SHORT_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: TH_TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

export type FormattedDateTime = {
  date: string
  dateLong: string
  weekday: string
  time: string
  full: string
  isoLocal: string
  relative: string | null
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: TH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  return a.toLocaleDateString('th-TH', opts) === b.toLocaleDateString('th-TH', opts)
}

export function formatRelativeThai(iso: string | null | undefined): string | null {
  const d = parseDate(iso)
  if (!d) return null
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 0) return 'กำลังจะมาถึง'
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24 && isSameCalendarDay(d, now)) return `${hours} ชั่วโมงที่แล้ว`
  if (isSameCalendarDay(d, now)) return 'วันนี้'
  const days = Math.floor(diffMs / 86_400_000)
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันที่แล้ว`
  return null
}

export function formatWeekdayThai(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('th-TH', { timeZone: TH_TZ, weekday: 'short' })
}

export function formatDateThai(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('th-TH', DATE_SHORT_OPTS)
}

export function formatDateLongThai(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('th-TH', DATE_LONG_OPTS)
}

export function formatTimeThai(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return (
    d.toLocaleTimeString('th-TH', {
      timeZone: TH_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' น.'
  )
}

export function formatIsoTooltip(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return ''
  return d.toLocaleString('th-TH', {
    timeZone: TH_TZ,
    dateStyle: 'full',
    timeStyle: 'medium',
  })
}

export function formatDateTimeThai(iso: string | null | undefined): FormattedDateTime {
  const d = parseDate(iso)
  if (!d) {
    return {
      date: '—',
      dateLong: '—',
      weekday: '',
      time: '—',
      full: '—',
      isoLocal: '',
      relative: null,
    }
  }
  const date = formatDateThai(iso)
  const dateLong = formatDateLongThai(iso)
  const weekday = formatWeekdayThai(iso)
  const time = formatTimeThai(iso)
  return {
    date,
    dateLong,
    weekday,
    time,
    full: `${date} · ${time}`,
    isoLocal: formatIsoTooltip(iso),
    relative: formatRelativeThai(iso),
  }
}

export function formatDateTimeRangeThai(startIso: string, endIso: string) {
  const start = parseDate(startIso)
  const end = parseDate(endIso)
  if (!start || !end) return { date: '—', timeRange: '—', full: '—', weekday: '' }

  const sameDay = isSameCalendarDay(start, end)
  const date = formatDateThai(startIso)
  const weekday = formatWeekdayThai(startIso)
  const timeRange = sameDay
    ? `${formatTimeThai(startIso)} – ${formatTimeThai(endIso)}`
    : `${formatDateThai(startIso)} ${formatTimeThai(startIso)} – ${formatDateThai(endIso)} ${formatTimeThai(endIso)}`

  return {
    date,
    weekday,
    timeRange,
    full: sameDay ? `${weekday} ${date} · ${formatTimeThai(startIso)} – ${formatTimeThai(endIso)}` : timeRange,
  }
}

export const TIMESTAMP_LABELS = {
  uploaded: 'อัปโหลดไฟล์',
  created: 'สร้างรายการ',
  updated: 'อัปเดตล่าสุด',
  published: 'เผยแพร่',
  scheduled: 'กำหนดการ',
  meeting: 'นัดประชุม',
} as const

export type TimestampLabelKey = keyof typeof TIMESTAMP_LABELS
