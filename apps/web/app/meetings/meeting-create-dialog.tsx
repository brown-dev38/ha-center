'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, CheckCircle2, XCircle } from 'lucide-react'
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
import { useMeetingRoomsAvailability } from '@/hooks/use-meeting-rooms'
import { usePermissions } from '@/hooks/use-permissions'
import {
  createMeeting,
  type MeetingDetail,
  type MeetingDetailFull,
} from '@/app/meetings/meeting-rooms-api'
import { draftToApiPayload, type MeetingParticipantDraft } from '@/app/meetings/meeting-participants'
import { buildFollowUpMeetingDefaults } from '@/app/meetings/meeting-detail'
import { useAuthUser } from '@/app/common/use-auth'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

const MEETING_TYPES = [
  { value: 'general', label: 'ประชุมทั่วไป' },
  { value: 'board', label: 'คณะกรรมการ' },
  { value: 'committee', label: 'คณะทำงาน' },
  { value: 'quality', label: 'ทีมคุณภาพ' },
]

const createSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุหัวข้อ'),
  type: z.string().min(1),
  date: z.string().min(1, 'เลือกวันที่'),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  roomId: z.string().optional(),
  description: z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>

const EMPTY_DEFAULTS: CreateForm = {
  title: '',
  type: 'general',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  roomId: '',
  description: '',
}

export type MeetingCreateDialogProps = {
  /** คัดลอกข้อมูลจากการประชุมเดิม — โหมดนัดครั้งต่อไป */
  sourceMeeting?: MeetingDetailFull
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** อนุญาตผู้จัดประชุมเดิม (ใช้กับนัดครั้งต่อไป) */
  allowOrganizer?: boolean
  onCreated?: (meeting: MeetingDetail) => void
  hideDefaultTrigger?: boolean
}

export function MeetingCreateDialog({
  sourceMeeting,
  trigger,
  open: controlledOpen,
  onOpenChange,
  allowOrganizer = false,
  onCreated,
  hideDefaultTrigger = false,
}: MeetingCreateDialogProps = {}) {
  const { canManageMeetingRooms } = usePermissions()
  const currentUserId = useAuthUser()?.id
  const isFollowUp = !!sourceMeeting
  const isOrganizer =
    allowOrganizer && !!sourceMeeting && sourceMeeting.organizer.id === currentUserId
  const canCreate = canManageMeetingRooms() || isOrganizer

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [participants, setParticipants] = useState<MeetingParticipantDraft[]>([])
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: formResolver(createSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const date = watch('date')
  const startTime = watch('startTime')
  const endTime = watch('endTime')
  const roomId = watch('roomId')

  const availabilityParams = useMemo(() => {
    if (!date || !startTime || !endTime) return null
    return { date, startTime, endTime }
  }, [date, startTime, endTime])

  const { data: rooms, isLoading: roomsLoading } = useMeetingRoomsAvailability(availabilityParams)

  useEffect(() => {
    if (!open) return
    if (sourceMeeting) {
      const defaults = buildFollowUpMeetingDefaults(sourceMeeting)
      reset(defaults.form)
      setParticipants(defaults.participants)
      return
    }
    reset(EMPTY_DEFAULTS)
    setParticipants([])
  }, [open, sourceMeeting, reset])

  useEffect(() => {
    if (roomId && rooms?.length) {
      const selected = rooms.find((r) => r.id === roomId)
      if (selected && !selected.isAvailable) setValue('roomId', '')
    }
  }, [rooms, roomId, setValue])

  const mutation = useMutation({
    mutationFn: async (values: CreateForm) => {
      const startDatetime = new Date(`${values.date}T${values.startTime}:00`).toISOString()
      const endDatetime = new Date(`${values.date}T${values.endTime}:00`).toISOString()
      return createMeeting({
        title: values.title,
        type: values.type,
        roomId: values.roomId || undefined,
        startDatetime,
        endDatetime,
        description: values.description,
        participants: draftToApiPayload(participants),
      })
    },
    onSuccess: (meeting) => {
      showSuccessToast(isFollowUp ? 'นัดการประชุมครั้งต่อไปสำเร็จ' : 'สร้างการประชุมสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      onCreated?.(meeting)
      if (!onCreated) {
        reset(EMPTY_DEFAULTS)
        setParticipants([])
      }
      setOpen(false)
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'สร้างไม่สำเร็จ')
    },
  })

  if (!canCreate) return null

  const busy = isSubmitting || mutation.isPending
  const dialogTitle = isFollowUp ? 'นัดการประชุมครั้งต่อไป' : 'นัดการประชุมใหม่'
  const dialogDescription = isFollowUp
    ? `สร้างจาก «${sourceMeeting?.title}» — คัดลอกห้อง ผู้เข้าร่วม และเวลาเดิม (+7 วัน) ปรับได้ก่อนบันทึก`
    : 'เลือกวัน เวลา และห้อง — ระบบตรวจห้องว่างอัตโนมัติ'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next && !sourceMeeting) setParticipants([])
      }}
    >
      {!hideDefaultTrigger &&
        (trigger ?? (
          <Button type="button" className="gap-2" onClick={() => setOpen(true)}>
            <CalendarPlus className="size-4" />
            นัดประชุม
          </Button>
        ))}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={isFollowUp ? 'mtg-follow-title' : 'mtg-title'}>หัวข้อการประชุม</Label>
            <Input
              id={isFollowUp ? 'mtg-follow-title' : 'mtg-title'}
              {...register('title')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={isFollowUp ? 'mtg-follow-type' : 'mtg-type'}>ประเภท</Label>
              <select
                id={isFollowUp ? 'mtg-follow-type' : 'mtg-type'}
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
              <Label htmlFor={isFollowUp ? 'mtg-follow-date' : 'mtg-date'}>วันที่</Label>
              <Input
                id={isFollowUp ? 'mtg-follow-date' : 'mtg-date'}
                type="date"
                {...register('date')}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={isFollowUp ? 'mtg-follow-start' : 'mtg-start'}>เริ่ม</Label>
              <Input
                id={isFollowUp ? 'mtg-follow-start' : 'mtg-start'}
                type="time"
                {...register('startTime')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={isFollowUp ? 'mtg-follow-end' : 'mtg-end'}>สิ้นสุด</Label>
              <Input
                id={isFollowUp ? 'mtg-follow-end' : 'mtg-end'}
                type="time"
                {...register('endTime')}
              />
            </div>
          </div>

          <input type="hidden" {...register('roomId')} />

          <div className="space-y-2">
            <Label>ห้องประชุม</Label>
            {!availabilityParams ? (
              <p className="text-xs text-muted-foreground">เลือกวันและเวลาก่อนเพื่อดูห้องว่าง</p>
            ) : roomsLoading ? (
              <p className="text-xs text-muted-foreground">กำลังตรวจสอบห้องว่าง...</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setValue('roomId', '')}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                    !roomId ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                  )}
                >
                  ไม่ระบุห้อง / ออนไลน์
                </button>
                {(rooms ?? []).map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    disabled={!room.isAvailable}
                    onClick={() => room.isAvailable && setValue('roomId', room.id)}
                    className={cn(
                      'flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-left text-sm transition',
                      !room.isAvailable && 'cursor-not-allowed opacity-50',
                      roomId === room.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30'
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 font-medium">
                      {room.name}
                      {room.isAvailable ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <XCircle className="size-4 text-rose-500" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {room.code}
                      {room.capacity ? ` · ${room.capacity} ที่นั่ง` : ''}
                      {!room.isAvailable && room.conflictingMeetings?.[0]
                        ? ` · ชน: ${room.conflictingMeetings[0]}`
                        : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <MeetingParticipantPicker
            value={participants}
            onChange={setParticipants}
            enabled={open}
          />

          <div className="space-y-2">
            <Label htmlFor={isFollowUp ? 'mtg-follow-desc' : 'mtg-desc'}>รายละเอียด (ไม่บังคับ)</Label>
            <Input
              id={isFollowUp ? 'mtg-follow-desc' : 'mtg-desc'}
              {...register('description')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : isFollowUp ? 'นัดครั้งต่อไป' : 'สร้างการประชุม'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
