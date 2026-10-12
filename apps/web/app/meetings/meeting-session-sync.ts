import type { TimerRunState } from '@/app/meetings/meeting-presentation-timer'

export type MeetingSessionSyncPayload = {
  agendaIndex: number
  currentOrderNo: number
  secondsLeft: number
  initialSeconds: number
  runState: TimerRunState
  meetingTitle: string
  agendaTitle: string
  agendaContent: string
  updatedAt: number
}

const channels = new Map<string, BroadcastChannel>()

function getChannel(meetingId: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null
  }
  let ch = channels.get(meetingId)
  if (!ch) {
    ch = new BroadcastChannel(`ha-meeting-session-${meetingId}`)
    channels.set(meetingId, ch)
  }
  return ch
}

export function publishMeetingSessionState(
  meetingId: string,
  payload: MeetingSessionSyncPayload
) {
  const ch = getChannel(meetingId)
  ch?.postMessage(payload)
}

export function subscribeMeetingSessionState(
  meetingId: string,
  onMessage: (payload: MeetingSessionSyncPayload) => void
) {
  const ch = getChannel(meetingId)
  if (!ch) return () => {}

  const handler = (ev: MessageEvent<MeetingSessionSyncPayload>) => {
    if (ev.data && typeof ev.data === 'object') onMessage(ev.data)
  }
  ch.addEventListener('message', handler)
  return () => ch.removeEventListener('message', handler)
}
