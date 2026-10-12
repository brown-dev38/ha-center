import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'

import { getApiUrl } from '@/app/common/api-url'
import { fetchApiList } from '@/app/common/api-json'
import { readApiData, readApiJson } from '@/app/common/parse-api-response'

export type MeetingRoomAdmin = {
  id: string
  name: string
  code: string
  capacity: number | null
  location: string | null
  equipment: string | null
  isActive: boolean
  meetingsCount?: number
}

export type MeetingRoomAvailability = {
  id: string
  name: string
  code: string
  capacity: number | null
  location: string | null
  equipment?: string | null
  isAvailable: boolean
  conflictingMeetings?: string[]
}

export type UpsertMeetingRoomInput = {
  name: string
  code: string
  capacity?: number
  location?: string
  equipment?: string
  isActive?: boolean
}


async function parseJson<T>(response: Response): Promise<T> {
  return readApiData<T>(response)
}

export async function fetchAllMeetingRooms(): Promise<MeetingRoomAdmin[]> {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/rooms/all`, {
    headers: apiHeaders(false),
  })
  return parseJson<MeetingRoomAdmin[]>(response)
}

export async function fetchAvailableRooms(params: {
  date: string
  startTime: string
  endTime: string
}): Promise<MeetingRoomAvailability[]> {
  const q = new URLSearchParams(params)
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/rooms?${q}`, {
    headers: apiHeaders(false),
  })
  return parseJson<MeetingRoomAvailability[]>(response)
}

export async function createMeetingRoom(input: UpsertMeetingRoomInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/rooms`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<MeetingRoomAdmin>(response)
}

export async function updateMeetingRoom(roomId: string, input: Partial<UpsertMeetingRoomInput>) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/rooms/${roomId}`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<MeetingRoomAdmin>(response)
}

export async function toggleMeetingRoomActive(roomId: string, isActive?: boolean) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/rooms/${roomId}/toggle-active`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(isActive !== undefined ? { isActive } : {}),
  })
  return parseJson<MeetingRoomAdmin>(response)
}

export type DepartmentOption = {
  id: string
  code: string
  name: string
}

export type MeetingParticipantOption = {
  id: string
  name: string
  departmentId: string | null
  departmentName: string | null
  departmentCode: string | null
  positionTitle: string | null
}

export type MeetingParticipantDetail = {
  id: string
  userId: string | null
  isGuest: boolean
  name: string
  departmentName: string | null
  departmentCode: string | null
  positionTitle: string | null
  status: string
}

export type MeetingAgendaItem = {
  id: string
  title: string
  description?: string | null
  orderNo: number
  durationMinutes: number | null
  presenterId: string | null
  presenterName: string | null
  actualDurationSeconds: number | null
  timerStatus: string | null
  hasAttachment?: boolean
  attachmentFileName?: string | null
  attachmentPath?: string | null
  attachmentSource?: 'upload' | 'link'
  attachmentPreviewUrl?: string
  attachmentExternalUrl?: string
}

export type MeetingChecklistItem = {
  id: string
  title: string
  isCompleted: boolean
  sortOrder: number
}

export type MeetingMinuteItem = {
  id: string
  summary: string | null
  pdfPath: string | null
  createdAt: string
}

export type MeetingDetail = {
  id: string
  title: string
  type: string
  status: string
  startAt: string
  endAt: string
  description?: string | null
  room?: { id: string; name: string; code: string } | null
  participants: MeetingParticipantDetail[]
}

export type MeetingDetailFull = MeetingDetail & {
  bookingStatus: string
  preparationStatus: string
  preparationNotes: string | null
  location: string | null
  isOnline: boolean
  meetingUrl: string | null
  organizer: { id: string; name: string }
  room: {
    id: string
    name: string
    code: string
    capacity: number | null
    location: string | null
  } | null
  agendas: MeetingAgendaItem[]
  checklist: MeetingChecklistItem[]
  minutes: MeetingMinuteItem[]
}

export type MeetingHistoryItem = {
  id: string
  title: string
  type: string
  status: string
  startAt: string
  endAt: string
  room: { id: string; name: string; code: string } | null
  minutesPdfPath: string | null
}

export type MeetingParticipantApiItem =
  | { userId: string }
  | { displayName: string; departmentName: string; positionTitle?: string }

export type CreateMeetingInput = {
  title: string
  type: string
  roomId?: string
  startDatetime: string
  endDatetime: string
  description?: string
  participantIds?: string[]
  participants?: MeetingParticipantApiItem[]
}

export async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/departments/options`, {
    headers: apiHeaders(false),
  })
  return parseJson<DepartmentOption[]>(response)
}

export async function fetchMeetingParticipantOptions(
  departmentId?: string
): Promise<MeetingParticipantOption[]> {
  const q = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ''
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/participants/options${q}`, {
    headers: apiHeaders(false),
  })
  return parseJson<MeetingParticipantOption[]>(response)
}

export async function fetchMeetingDetail(meetingId: string): Promise<MeetingDetailFull> {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}`, {
    headers: apiHeaders(false),
  })
  return parseJson<MeetingDetailFull>(response)
}

export async function fetchMeetingHistory(params?: {
  page?: number
  limit?: number
  year?: number
  month?: number
}): Promise<{ data: MeetingHistoryItem[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.limit) q.set('limit', String(params.limit))
  if (params?.year) q.set('year', String(params.year))
  if (params?.month) q.set('month', String(params.month))
  const qs = q.toString() ? `?${q}` : ''

  const { data, pagination } = await fetchApiList<
    MeetingHistoryItem,
    { page: number; limit: number; total: number; totalPages: number }
  >(`meetings/history${qs}`, {
    headers: apiHeaders(false),
  })

  return {
    data,
    total: pagination?.total ?? data.length,
  }
}

export async function updateMeetingBookingStatus(meetingId: string, status: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}/booking-status`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ status }),
  })
  return parseJson<MeetingDetailFull>(response)
}

export async function updateMeetingParticipants(
  meetingId: string,
  participants: MeetingParticipantApiItem[]
) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}/participants`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify({ participants }),
  })
  return parseJson<MeetingDetail>(response)
}

export async function createMeeting(input: CreateMeetingInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<MeetingDetail>(response)
}

export async function updateMeetingStatus(meetingId: string, status: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}/status`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ status }),
  })
  return parseJson(response)
}

export type UpdateMeetingInput = {
  title?: string
  type?: string
  description?: string
  roomId?: string
  startDatetime?: string
  endDatetime?: string
  participantIds?: string[]
  participants?: MeetingParticipantApiItem[]
}

export async function updateMeeting(meetingId: string, input: UpdateMeetingInput) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return parseJson<MeetingDetailFull>(response)
}

export async function deleteMeeting(meetingId: string) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: apiHeaders(false),
  })
  await readApiData<Record<string, never>>(response)
  return { success: true as const }
}

export type AgendaBatchItem = {
  id?: string
  title: string
  orderNo: number
  durationMinutes?: number
  presenterId?: string
  description?: string
}

export async function updateAgendaTimer(
  meetingId: string,
  agendaId: string,
  payload: { actualDurationSeconds: number; status: string }
) {
  const response = await apiFetch(
    `${getApiUrl()}/api/v1/meetings/${meetingId}/agendas/${agendaId}/timer`,
    {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(payload),
    }
  )
  return parseJson(response)
}

export async function deleteMeetingAgenda(meetingId: string, agendaId: string) {
  const response = await apiFetch(
    `${getApiUrl()}/api/v1/meetings/${meetingId}/agendas/${agendaId}`,
    {
      method: 'DELETE',
      headers: apiHeaders(),
    }
  )
  return parseJson<MeetingDetailFull>(response)
}

export async function syncMeetingAgendas(meetingId: string, agendas: AgendaBatchItem[]) {
  const response = await apiFetch(`${getApiUrl()}/api/v1/meetings/${meetingId}/agendas/batch`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ agendas }),
  })
  return parseJson<MeetingDetailFull>(response)
}

export async function uploadMeetingAgendaLink(
  meetingId: string,
  agendaId: string,
  fileUrl: string
) {
  const response = await apiFetch(
    `${getApiUrl()}/api/v1/meetings/${meetingId}/agendas/${agendaId}/attachment`,
    {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ fileUrl: fileUrl.trim() }),
    }
  )
  return parseJson<MeetingDetailFull>(response)
}

export async function uploadMeetingAgendaAttachment(
  meetingId: string,
  agendaId: string,
  file: File,
  onProgress?: (percent: number, loaded: number) => void
) {
  const form = new FormData()
  form.append('file', file)

  const { uploadWithProgress } = await import('@/app/common/upload-xhr')
  const result = await uploadWithProgress<MeetingDetailFull>({
    url: `${getApiUrl()}/api/v1/meetings/${meetingId}/agendas/${agendaId}/attachment`,
    method: 'POST',
    body: form,
    onProgress: (p) => onProgress?.(p.percent, p.loaded),
  })
  if (!result.data) throw new Error(result.message ?? 'อัปโหลดไฟล์ไม่สำเร็จ')
  return result.data
}
