import type { MeetingAgendaItem } from '@/app/meetings/meeting-rooms-api'

export type AgendaLineItem = { no: string; text: string }

export type AgendaEditorState = {
  title: string
  content: string
  items: AgendaLineItem[]
}

export const MEETING_TYPE_OPTIONS = [
  { value: 'general', label: 'ประชุมทั่วไป' },
  { value: 'executive', label: 'ประชุมผู้บริหาร' },
  { value: 'board', label: 'คณะกรรมการ' },
  { value: 'committee', label: 'คณะทำงาน' },
  { value: 'quality', label: 'ทีมคุณภาพ' },
] as const

export const TIMER_PRESETS_MIN = [5, 10, 15, 20, 25, 30] as const

type StoredAgendaBody = {
  content?: string
  items?: AgendaLineItem[]
}

function tryParseJson(raw: string): StoredAgendaBody | null {
  try {
    const parsed = JSON.parse(raw) as StoredAgendaBody
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* plain text legacy */
  }
  return null
}

export function parseAgendaDescription(description: string | null | undefined): {
  content: string
  items: AgendaLineItem[]
} {
  if (!description?.trim()) {
    return { content: '', items: [{ no: '1.1', text: '' }, { no: '1.2', text: '' }] }
  }
  const json = tryParseJson(description)
  if (json) {
    return {
      content: json.content ?? '',
      items:
        json.items?.length && json.items.length > 0
          ? json.items
          : [{ no: '1.1', text: '' }, { no: '1.2', text: '' }],
    }
  }
  return { content: description, items: [{ no: '1.1', text: '' }, { no: '1.2', text: '' }] }
}

export function stringifyAgendaDescription(state: {
  content: string
  items: AgendaLineItem[]
}): string {
  return JSON.stringify({
    content: state.content.trim(),
    items: state.items.filter((i) => i.text.trim() || i.no.trim()),
  })
}

export function agendaToEditorState(agenda: MeetingAgendaItem, orderNo: number): AgendaEditorState {
  const parsed = parseAgendaDescription(
    (agenda as MeetingAgendaItem & { description?: string | null }).description
  )
  return {
    title: agenda.title || `ระเบียบวาระที่ ${orderNo}`,
    content: parsed.content,
    items: parsed.items,
  }
}

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatSessionTimeRange(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)} - ${fmt(end)} น.`
}

export function formatTimerDisplay(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function defaultAgendaSlots(count = 3): AgendaEditorState[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `ระเบียบวาระที่ ${i + 1}`,
    content: '',
    items: [
      { no: `${i + 1}.1`, text: '' },
      { no: `${i + 1}.2`, text: '' },
    ],
  }))
}
