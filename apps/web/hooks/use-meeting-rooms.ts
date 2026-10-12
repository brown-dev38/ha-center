'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllMeetingRooms,
  fetchAvailableRooms,
  fetchDepartmentOptions,
  fetchMeetingDetail,
  fetchMeetingHistory,
  fetchMeetingParticipantOptions,
  deleteMeeting,
  deleteMeetingAgenda,
  syncMeetingAgendas,
  updateAgendaTimer,
  updateMeeting,
  updateMeetingBookingStatus,
  updateMeetingParticipants,
  uploadMeetingAgendaAttachment,
  updateMeetingStatus,
  type AgendaBatchItem,
  type UpdateMeetingInput,
} from '@/app/meetings/meeting-rooms-api'
import { useSession } from 'next-auth/react'

export function useMeetingRoomsAdmin() {
  const { status } = useSession()
  return useQuery({
    queryKey: ['meeting-rooms', 'all', status],
    queryFn: fetchAllMeetingRooms,
    enabled: status === 'authenticated',
  })
}

export function useDepartmentOptions(enabled: boolean) {
  const { status } = useSession()
  return useQuery({
    queryKey: ['meetings', 'department-options', status],
    queryFn: fetchDepartmentOptions,
    enabled: status === 'authenticated' && enabled,
  })
}

export function useMeetingParticipantOptions(enabled: boolean, departmentId?: string) {
  const { status } = useSession()
  return useQuery({
    queryKey: ['meetings', 'participant-options', status, departmentId ?? 'all'],
    queryFn: () => fetchMeetingParticipantOptions(departmentId),
    enabled: status === 'authenticated' && enabled,
  })
}

export function useMeetingDetail(meetingId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['meetings', 'detail', meetingId],
    queryFn: () => fetchMeetingDetail(meetingId!),
    enabled: enabled && !!meetingId,
  })
}

export function useMeetingHistory(params?: { limit?: number }) {
  return useQuery({
    queryKey: ['meetings', 'history', params],
    queryFn: () => fetchMeetingHistory({ limit: params?.limit ?? 50 }),
  })
}

export function useUpdateMeetingBookingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, status }: { meetingId: string; status: string }) =>
      updateMeetingBookingStatus(meetingId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useUpdateMeetingStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetingId, status }: { meetingId: string; status: string }) =>
      updateMeetingStatus(meetingId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      meetingId,
      input,
    }: {
      meetingId: string
      input: UpdateMeetingInput
    }) => updateMeeting(meetingId, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (meetingId: string) => deleteMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useSyncMeetingAgendas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      meetingId,
      agendas,
    }: {
      meetingId: string
      agendas: AgendaBatchItem[]
    }) => syncMeetingAgendas(meetingId, agendas),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useUploadAgendaAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      meetingId,
      agendaId,
      file,
      onProgress,
    }: {
      meetingId: string
      agendaId: string
      file: File
      onProgress?: (percent: number, loaded: number) => void
    }) => uploadMeetingAgendaAttachment(meetingId, agendaId, file, onProgress),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useDeleteMeetingAgenda() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      meetingId,
      agendaId,
    }: {
      meetingId: string
      agendaId: string
    }) => deleteMeetingAgenda(meetingId, agendaId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useUpdateAgendaTimer() {
  return useMutation({
    mutationFn: ({
      meetingId,
      agendaId,
      actualDurationSeconds,
      status,
    }: {
      meetingId: string
      agendaId: string
      actualDurationSeconds: number
      status: string
    }) => updateAgendaTimer(meetingId, agendaId, { actualDurationSeconds, status }),
  })
}

export function useUpdateMeetingParticipants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      meetingId,
      participants,
    }: {
      meetingId: string
      participants: Parameters<typeof updateMeetingParticipants>[1]
    }) => updateMeetingParticipants(meetingId, participants),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      queryClient.invalidateQueries({ queryKey: ['meetings', 'detail', vars.meetingId] })
    },
  })
}

export function useMeetingRoomsAvailability(
  params: { date: string; startTime: string; endTime: string } | null
) {
  return useQuery({
    queryKey: ['meeting-rooms', 'availability', params],
    queryFn: () => fetchAvailableRooms(params!),
    enabled: !!params?.date && !!params.startTime && !!params.endTime,
  })
}
