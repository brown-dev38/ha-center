import type { MeetingDetailFull } from '@/app/meetings/meeting-rooms-api'

export function isMeetingOrganizer(
  meeting: MeetingDetailFull | undefined,
  userId: string | undefined
): boolean {
  return !!userId && !!meeting && meeting.organizer.id === userId
}

export function isMeetingParticipant(
  meeting: MeetingDetailFull | undefined,
  userId: string | undefined
): boolean {
  if (!userId || !meeting?.participants?.length) return false
  return meeting.participants.some((p) => p.userId === userId)
}

/** ผู้จัด / แอดมินห้อง — แก้ไขและควบคุมเวลาได้ */
export function canControlMeetingSession(
  meeting: MeetingDetailFull | undefined,
  userId: string | undefined,
  canManageRooms: boolean
): boolean {
  return canManageRooms || isMeetingOrganizer(meeting, userId)
}

/** ผู้เข้าร่วมหรือผู้ใช้ทั่วไป — ดูอย่างเดียว */
export function isReadOnlyMeetingSession(
  meeting: MeetingDetailFull | undefined,
  userId: string | undefined,
  canManageRooms: boolean
): boolean {
  if (!meeting) return false
  return !canControlMeetingSession(meeting, userId, canManageRooms)
}

export type MeetingSessionRole = 'organizer' | 'participant' | 'viewer'

export function meetingSessionRoleLabel(
  meeting: MeetingDetailFull | undefined,
  userId: string | undefined,
  canManageRooms: boolean
): MeetingSessionRole {
  if (canControlMeetingSession(meeting, userId, canManageRooms)) return 'organizer'
  if (isMeetingParticipant(meeting, userId)) return 'participant'
  return 'viewer'
}
