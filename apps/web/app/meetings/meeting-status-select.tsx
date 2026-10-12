'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MEETING_STATUS_ORDER,
  getMeetingStatusStyle,
  type MeetingStatusKey,
} from '@/app/meetings/meetings'
import { updateMeetingStatus } from '@/app/meetings/meeting-rooms-api'
import { usePermissions } from '@/hooks/use-permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

type MeetingStatusSelectProps = {
  meetingId: string
  currentStatus: string
  compact?: boolean
  className?: string
}

export function MeetingStatusSelect({
  meetingId,
  currentStatus,
  compact,
  className,
}: MeetingStatusSelectProps) {
  const { canManageMeetingRooms } = usePermissions()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (status: MeetingStatusKey) => updateMeetingStatus(meetingId, status),
    onSuccess: () => {
      showSuccessToast('อัปเดตสถานะแล้ว')
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    },
  })

  if (!canManageMeetingRooms()) return null

  const style = getMeetingStatusStyle(currentStatus)

  return (
    <select
      value={currentStatus}
      disabled={mutation.isPending}
      onChange={(e) => mutation.mutate(e.target.value as MeetingStatusKey)}
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-xs font-semibold outline-none transition',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        style.chip,
        compact && 'max-w-full min-w-0 truncate',
        className
      )}
      title="เปลี่ยนสถานะการประชุม"
    >
      {MEETING_STATUS_ORDER.map((key) => {
        const s = getMeetingStatusStyle(key)
        return (
          <option key={key} value={key}>
            {s.label}
          </option>
        )
      })}
    </select>
  )
}
