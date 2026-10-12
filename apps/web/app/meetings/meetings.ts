export type MeetingListItem = {
  id: string
  title: string
  type: string
  status: string
  bookingStatus?: string
  startAt: string
  endAt: string
  room?: {
    id: string
    name: string
    code: string
    capacity?: number | null
    location?: string | null
  } | null
  organizer?: { id: string; name: string }
  participantsCount?: number
}

export const MEETING_STATUS_LABELS: Record<string, string> = {
  scheduled: 'นัดหมายแล้ว',
  in_progress: 'กำลังประชุม',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
}

export type MeetingStatusKey = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export const MEETING_STATUS_ORDER: MeetingStatusKey[] = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]

/** สีสถานะชัดเจน — น้ำเงิน / ส้ม / เขียว / แดง */
export const MEETING_STATUS_STYLES: Record<
  MeetingStatusKey,
  { dot: string; chip: string; border: string; ring: string; label: string }
> = {
  scheduled: {
    label: 'นัดหมายแล้ว',
    dot: 'bg-sky-500 shadow-[0_0_0_2px_rgba(14,165,233,0.25)]',
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    border: 'border-l-sky-500',
    ring: 'ring-sky-500/20',
  },
  in_progress: {
    label: 'กำลังประชุม',
    dot: 'bg-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.3)] animate-pulse',
    chip: 'border-orange-200 bg-orange-50 text-orange-900',
    border: 'border-l-orange-500',
    ring: 'ring-orange-500/25',
  },
  completed: {
    label: 'เสร็จสิ้น',
    dot: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    border: 'border-l-emerald-500',
    ring: 'ring-emerald-500/20',
  },
  cancelled: {
    label: 'ยกเลิก',
    dot: 'bg-rose-400/80',
    chip: 'border-rose-200 bg-rose-50/80 text-rose-700 line-through decoration-rose-400/60',
    border: 'border-l-rose-400',
    ring: 'ring-rose-400/15',
  },
}

export function getMeetingStatusStyle(status: string) {
  return (
    MEETING_STATUS_STYLES[status as MeetingStatusKey] ?? MEETING_STATUS_STYLES.scheduled
  )
}

export function getMeetingStatusLabel(status: string) {
  return MEETING_STATUS_LABELS[status] ?? status
}

const TH_MONTHS = [
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
]

const TH_WEEKDAYS_SHORT = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

export function formatMeetingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatMeetingDateLong(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatMonthYear(year: number, month: number): string {
  const buddhistYear = year + 543
  return `${TH_MONTHS[month - 1]} ${buddhistYear} (${year})`
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export type CalendarCell = {
  date: Date
  inCurrentMonth: boolean
  key: string
}

/** ปฏิทินเริ่มวันจันทร์ */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month - 1, 1)
  const lastOfMonth = new Date(year, month, 0)

  const startPad = (firstOfMonth.getDay() + 6) % 7
  const cells: CalendarCell[] = []

  for (let i = startPad; i > 0; i--) {
    const date = new Date(year, month - 1, 1 - i)
    cells.push({ date, inCurrentMonth: false, key: toDateKey(date) })
  }

  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, month - 1, d)
    cells.push({ date, inCurrentMonth: true, key: toDateKey(date) })
  }

  let trailing = 1
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month, trailing++)
    cells.push({ date, inCurrentMonth: false, key: toDateKey(date) })
  }

  return cells
}

export function groupMeetingsByDay(meetings: MeetingListItem[]): Map<string, MeetingListItem[]> {
  const map = new Map<string, MeetingListItem[]>()
  for (const m of meetings) {
    const key = toDateKey(new Date(m.startAt))
    const list = map.get(key) ?? []
    list.push(m)
    map.set(key, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }
  return map
}

export { TH_WEEKDAYS_SHORT }
