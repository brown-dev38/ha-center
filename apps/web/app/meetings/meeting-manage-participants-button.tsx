'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MeetingParticipantsDialog } from '@/app/meetings/meeting-participants-dialog'
import { usePermissions } from '@/hooks/use-permissions'

type Props = {
  meetingId: string
  meetingTitle: string
  variant?: 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'default'
  className?: string
}

export function MeetingManageParticipantsButton({
  meetingId,
  meetingTitle,
  variant = 'outline',
  size = 'sm',
  className,
}: Props) {
  const { canManageMeetingRooms } = usePermissions()
  const [open, setOpen] = useState(false)

  if (!canManageMeetingRooms()) return null

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Users className="size-4" />
        ผู้เข้าร่วม
      </Button>
      <MeetingParticipantsDialog
        meetingId={meetingId}
        meetingTitle={meetingTitle}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
