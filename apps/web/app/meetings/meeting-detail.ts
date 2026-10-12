import type { MeetingDetailFull, MeetingParticipantDetail } from '@/app/meetings/meeting-rooms-api'
import {
  newParticipantKey,
  type MeetingParticipantDraft,
} from '@/app/meetings/meeting-participants'

export const BOOKING_WORKFLOW = [
  { id: 'pending', label: 'รอดำเนินการ', bookingStatus: 'pending' as const },
  { id: 'confirmed', label: 'อนุมัติแล้ว', bookingStatus: 'confirmed' as const },
  { id: 'in_progress', label: 'กำลังประชุม', meetingStatus: 'in_progress' as const },
  { id: 'completed', label: 'เสร็จสิ้น', meetingStatus: 'completed' as const },
  { id: 'cancelled', label: 'ยกเลิก', cancelled: true as const },
] as const

export type BookingWorkflowId = (typeof BOOKING_WORKFLOW)[number]['id']

export function getActiveWorkflowStep(meeting: {
  status: string
  bookingStatus: string
}): BookingWorkflowId {
  if (meeting.status === 'cancelled' || meeting.bookingStatus === 'cancelled') {
    return 'cancelled'
  }
  if (meeting.status === 'completed') return 'completed'
  if (meeting.status === 'in_progress') return 'in_progress'
  if (meeting.bookingStatus === 'confirmed') return 'confirmed'
  return 'pending'
}



export function workflowStepIndex(step: BookingWorkflowId): number {
  return BOOKING_WORKFLOW.findIndex((s) => s.id === step)
}

export const AGENDA_TIMELINE = [
  {
    id: 'booked',
    label: 'จองการประชุม',
    hint: 'บันทึกการจองห้องและเวลาแล้ว',
  },
  {
    id: 'attach',
    label: 'รอแนบวาระ',
    hint: 'กรุณาแนบวาระการประชุมเพื่อดำเนินการต่อ',
  },
  {
    id: 'confirm',
    label: 'รอยืนยันวาระ',
    hint: 'กดปุ่มบันทึกวาระด้านล่างเมื่อยืนยันแล้ว',
  },
  {
    id: 'minutes',
    label: 'สรุปมติ',
    hint: 'แนบได้หลังการประชุมเสร็จสิ้น',
  },
] as const


export function getAgendaTimelineState(meeting: MeetingDetailFull) {
  const hasAgendas = meeting.agendas.length > 0
  const hasMinutes = meeting.minutes.length > 0
  const isCompleted = meeting.status === 'completed'
  const booked = meeting.bookingStatus === 'confirmed' || meeting.bookingStatus === 'pending'

  return AGENDA_TIMELINE.map((step, i) => {
    let state: 'done' | 'current' | 'upcoming' = 'upcoming'
    if (step.id === 'booked' && booked) state = 'done'
    if (step.id === 'attach') {
      if (hasAgendas) state = 'done'
      else if (booked) state = 'current'
    }
    if (step.id === 'confirm') {
      if (hasMinutes || isCompleted) state = 'done'
      else if (hasAgendas) state = 'current'
    }
    if (step.id === 'minutes') {
      if (hasMinutes) state = 'done'
      else if (isCompleted) state = 'current'
      else if (hasAgendas && i === 3) state = 'upcoming'
    }
    return { ...step, state }
  })
}



/** แสดงวาระอย่างน้อย 6 ช่องตามแบบฟอร์ม HA */
export function buildAgendaSlots(meeting: MeetingDetailFull, minSlots = 6) {
  const sorted = [...meeting.agendas].sort((a, b) => a.orderNo - b.orderNo)
  const count = Math.max(minSlots, sorted.length)
  return Array.from({ length: count }, (_, i) => {
    const orderNo = i + 1
    const agenda = sorted.find((a) => a.orderNo === orderNo)
    return {
      orderNo,
      title: agenda?.title ?? null,
      agendaId: agenda?.id ?? null,
      hasDocument: agenda?.hasAttachment ?? false,
    }
  })
}

export function formatMeetingDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}



export function formatMeetingCreatedAt(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} - ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
}

export function meetingTypeLabel(type: string): string {
  const map: Record<string, string> = {
        general: 'ประชุมทั่วไป',
        executive: 'ประชุมผู้บริหาร',
        committee: 'ประชุมคณะกรรมการ',
        training: 'อบรม / สัมมนา',
  }
  return map[type] ?? type
}

export function buildIcsBlob(meeting: MeetingDetailFull): Blob {
  const start = new Date(meeting.startAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const end = new Date(meeting.endAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const location = meeting.room?.name ?? meeting.location ?? ''
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HA Center//Meeting//TH',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@ha-center`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${meeting.title.replace(/\n/g, ' ')}`,
    location ? `LOCATION:${location}` : '',
    meeting.description ? `DESCRIPTION:${meeting.description.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
  return new Blob([ics], { type: 'text/calendar;charset=utf-8' })
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}


function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** ชื่อการประชุมครั้งต่อไปจากชื่อเดิม */
export function buildFollowUpMeetingTitle(title: string): string {
  const trimmed = title.trim()
  if (/ครั้งต่อไป/.test(trimmed)) return trimmed
  return `${trimmed} (ครั้งต่อไป)`
}


/** เสนอวันเวลาเดิม +7 วัน (เลื่อนไปข้างหน้าจนไม่เป็นอดีต) */
export function suggestNextMeetingSlot(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const durationMs = Math.max(end.getTime() - start.getTime(), 30 * 60_000)

  const nextStart = new Date(start)
  nextStart.setDate(nextStart.getDate() + 7)
  const now = new Date()
  while (nextStart.getTime() < now.getTime()) {
    nextStart.setDate(nextStart.getDate() + 7)
  }

  const nextEnd = new Date(nextStart.getTime() + durationMs)
  return {
    date: toDateInputValue(nextStart),
    startTime: toTimeInputValue(nextStart),
    endTime: toTimeInputValue(nextEnd),
  }
}

// //
 export function meetingPreviousNote(description: string): string {
  const trimmed = description.trim()
  if (trimmed.length === 0) return ''
  return `${trimmed}\n\n`
 }
// //


export function meetingParticipantsToDraft(
  participants: MeetingParticipantDetail[]
): MeetingParticipantDraft[] {
  return participants.map((p) => ({
    key: newParticipantKey(),
    kind: p.isGuest || !p.userId ? ('guest' as const) : ('user' as const),
    userId: p.userId ?? undefined,
    displayName: p.name,
    departmentName: p.departmentName ?? '',
    positionTitle: p.positionTitle,
  }))
}


export function buildFollowUpMeetingDefaults(meeting: MeetingDetailFull) {
  const slot = suggestNextMeetingSlot(meeting.startAt, meeting.endAt)
  const previousNote = meeting.description?.trim()
    ? `${meeting.description.trim()}\n\n`
    : ''

  return {
    form: {
      title: buildFollowUpMeetingTitle(meeting.title),
      type: meeting.type,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      roomId: meeting.room?.id ?? '',
      description: `${previousNote}ต่อจากการประชุมเมื่อ ${formatMeetingDateShort(meeting.startAt)}`,
    },
    participants: meetingParticipantsToDraft(meeting.participants),
  }
}


