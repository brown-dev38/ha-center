'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MeetingParticipantPicker } from '@/app/meetings/meeting-participant-picker'
import { useMeetingDetail, useUpdateMeetingParticipants } from '@/hooks/use-meeting-rooms'
import { usePermissions } from '@/hooks/use-permissions'
import {
  draftToApiPayload,
  newParticipantKey,
  type MeetingParticipantDraft,
} from '@/app/meetings/meeting-participants'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

type Props = {
  meetingId: string
  meetingTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function detailToDraft(
  participants: {
    userId: string | null
    isGuest: boolean
    name: string
    departmentName: string | null
    positionTitle: string | null
  }[]
): MeetingParticipantDraft[] {
  return participants.map((p) => ({
    key: newParticipantKey(),
    kind: p.isGuest ? 'guest' : 'user',
    userId: p.userId ?? undefined,
    displayName: p.name,
    departmentName: p.departmentName ?? 'ไม่ระบุแผนก',
    positionTitle: p.positionTitle,
  }))
}

export function MeetingParticipantsDialog({
  meetingId,
  meetingTitle,
  open,
  onOpenChange,
}: Props) {
  const { canManageMeetingRooms } = usePermissions()
  const { data: detail, isLoading } = useMeetingDetail(meetingId, open)
  const mutation = useUpdateMeetingParticipants()
  const [participants, setParticipants] = useState<MeetingParticipantDraft[]>([])

  useEffect(() => {
    if (detail?.participants) {
      setParticipants(detailToDraft(detail.participants))
    }
  }, [detail])

  if (!canManageMeetingRooms()) return null

  const save = () => {
    mutation.mutate(
      { meetingId, participants: draftToApiPayload(participants) },
      {
        onSuccess: () => {
          showSuccessToast('บันทึกรายชื่อผู้เข้าร่วมแล้ว')
          onOpenChange(false)
        },
        onError: (err) => {
          showErrorToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            จัดการผู้เข้าร่วมประชุม
          </DialogTitle>
          <DialogDescription>{meetingTitle}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : (
          <MeetingParticipantPicker value={participants} onChange={setParticipants} enabled={open} />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={save} disabled={mutation.isPending || isLoading}>
            {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึกรายชื่อ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
