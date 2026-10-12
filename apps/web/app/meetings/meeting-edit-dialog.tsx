'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import { CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MeetingParticipantPicker } from '@/app/meetings/meeting-participant-picker'
import { useMeetingRoomsAvailability, useUpdateMeeting } from '@/hooks/use-meeting-rooms'
import type { MeetingDetailFull } from '@/app/meetings/meeting-rooms-api'
import {
  draftToApiPayload,
  type MeetingParticipantDraft,
} from '@/app/meetings/meeting-participants'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

const MEETING_TYPES = [
  { value: 'general', label: 'ประชุมทั่วไป' },
  { value: 'board', label: 'คณะกรรมการ' },
  { value: 'committee', label: 'คณะทำงาน' },
  { value: 'quality', label: 'ทีมคุณภาพ' },
  { value: 'executive', label: 'ประชุมผู้บริหาร' },
]

const editSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุหัวข้อ'),
  type: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  roomId: z.string().optional(),
  description: z.string().optional(),
})

type EditForm = z.infer<typeof editSchema>

function toDateInput(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeInput(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function participantsToDraft(meeting: MeetingDetailFull): MeetingParticipantDraft[] {
  return meeting.participants.map((p) => ({
    key: p.userId ?? `guest-${p.id}`,
    kind: p.isGuest ? 'guest' : 'user',
    userId: p.userId ?? undefined,
    displayName: p.name,
    departmentName: p.departmentName ?? '',
    positionTitle: p.positionTitle ?? null,
  }))
}

type Props = {
  meeting: MeetingDetailFull
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeetingEditDialog({ meeting, open, onOpenChange }: Props) {
  const [participants, setParticipants] = useState<MeetingParticipantDraft[]>([])
  const updateMutation = useUpdateMeeting()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: formResolver(editSchema),
    defaultValues: {
      title: meeting.title,
      type: meeting.type,
      date: toDateInput(meeting.startAt),
      startTime: toTimeInput(meeting.startAt),
      endTime: toTimeInput(meeting.endAt),
      roomId: meeting.room?.id ?? '',
      description: meeting.description ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: meeting.title,
        type: meeting.type,
        date: toDateInput(meeting.startAt),
        startTime: toTimeInput(meeting.startAt),
        endTime: toTimeInput(meeting.endAt),
        roomId: meeting.room?.id ?? '',
        description: meeting.description ?? '',
      })
      setParticipants(participantsToDraft(meeting))
    }
  }, [open, meeting, reset])

  const date = watch('date')
  const startTime = watch('startTime')
  const endTime = watch('endTime')
  const roomId = watch('roomId')

  const availabilityParams = useMemo(() => {
    if (!date || !startTime || !endTime) return null
    return { date, startTime, endTime }
  }, [date, startTime, endTime])

  const { data: rooms, isLoading: roomsLoading } = useMeetingRoomsAvailability(availabilityParams)

  const onSubmit = async (values: EditForm) => {
    try {
      await updateMutation.mutateAsync({
        meetingId: meeting.id,
        input: {
          title: values.title,
          type: values.type,
          description: values.description,
          roomId: values.roomId || undefined,
          startDatetime: new Date(`${values.date}T${values.startTime}:00`).toISOString(),
          endDatetime: new Date(`${values.date}T${values.endTime}:00`).toISOString(),
          participants: draftToApiPayload(participants),
        },
      })
      showSuccessToast('บันทึกการแก้ไขแล้ว')
      onOpenChange(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'แก้ไขไม่สำเร็จ')
    }
  }

  const busy = isSubmitting || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-emerald-600" />
            แก้ไขการประชุม
          </DialogTitle>
          <DialogDescription>ปรับหัวข้อ วันเวลา ห้อง และผู้เข้าร่วม</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">หัวข้อการประชุม</Label>
            <Input id="edit-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-type">ประเภท</Label>
              <select
                id="edit-type"
                {...register('type')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">วันที่</Label>
              <Input id="edit-date" type="date" {...register('date')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-start">เริ่ม</Label>
              <Input id="edit-start" type="time" {...register('startTime')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">สิ้นสุด</Label>
              <Input id="edit-end" type="time" {...register('endTime')} />
            </div>
          </div>

          <input type="hidden" {...register('roomId')} />

          <div className="space-y-2">
            <Label>ห้องประชุม</Label>
            {!availabilityParams ? (
              <p className="text-xs text-muted-foreground">เลือกวันและเวลาเพื่อดูห้องว่าง</p>
            ) : roomsLoading ? (
              <p className="text-xs text-muted-foreground">กำลังตรวจสอบ...</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setValue('roomId', '')}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm',
                    !roomId ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  ไม่ระบุห้อง
                </button>
                {(rooms ?? []).map((room) => {
                  const isCurrent = room.id === meeting.room?.id
                  const selectable = room.isAvailable || isCurrent
                  return (
                    <button
                      key={room.id}
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectable && setValue('roomId', room.id)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left text-sm',
                        !selectable && 'opacity-50',
                        roomId === room.id ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <span className="flex items-center justify-between font-medium">
                        {room.name}
                        {room.isAvailable || isCurrent ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : (
                          <XCircle className="size-4 text-rose-500" />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <MeetingParticipantPicker
            value={participants}
            onChange={setParticipants}
            enabled={open}
          />

          <div className="space-y-2">
            <Label htmlFor="edit-desc">รายละเอียด</Label>
            <Input id="edit-desc" {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
