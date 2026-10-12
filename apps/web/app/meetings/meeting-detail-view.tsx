'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  FileText,
  ListOrdered,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { MeetingScheduleTimestamp } from '@/app/common/record-timestamp'
import { EmptyState } from '@/app/empty-state'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { MeetingAgendaDialog } from '@/app/meetings/meeting-agenda-dialog'
import { MeetingCreateDialog } from '@/app/meetings/meeting-create-dialog'
import { MeetingEditDialog } from '@/app/meetings/meeting-edit-dialog'
import { MeetingManageParticipantsButton } from '@/app/meetings/meeting-manage-participants-button'
import {
  useDeleteMeeting,
  useMeetingDetail,
  useMeetingHistory,
  useUpdateMeetingBookingStatus,
  useUpdateMeetingStatusMutation,
} from '@/hooks/use-meeting-rooms'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuthUser } from '@/app/common/use-auth'
import { getApiUrl } from '@/app/common/api-url'
import {
  AGENDA_TIMELINE,
  BOOKING_WORKFLOW,
  buildAgendaSlots,
  buildIcsBlob,
  formatMeetingDateShort,
  getActiveWorkflowStep,
  getAgendaTimelineState,
  meetingTypeLabel,
  workflowStepIndex,
  type BookingWorkflowId,
} from '@/app/meetings/meeting-detail'
import { formatMeetingTime, getMeetingStatusStyle } from '@/app/meetings/meetings'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function MeetingDetailView() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const { canManageMeetingRooms } = usePermissions()
  const currentUserId = useAuthUser()?.id
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [scheduleNextOpen, setScheduleNextOpen] = useState(false)

  const { data: meeting, isLoading, isError } = useMeetingDetail(id)
  const deleteMutation = useDeleteMeeting()
  const { data: historyData } = useMeetingHistory({ limit: 100 })
  const bookingMutation = useUpdateMeetingBookingStatus()
  const statusMutation = useUpdateMeetingStatusMutation()

  const activeStep = meeting ? getActiveWorkflowStep(meeting) : 'pending'
  const activeIndex = workflowStepIndex(activeStep)

  const roomHistory = useMemo(() => {
    if (!meeting?.room?.id || !Array.isArray(historyData?.data)) return []
    return historyData.data.filter((h) => h.room?.id === meeting.room?.id)
  }, [meeting?.room?.id, historyData?.data])

  const agendaTimeline = meeting ? getAgendaTimelineState(meeting) : []
  const agendaSlots = meeting ? buildAgendaSlots(meeting) : []
  const missingAgendas = agendaSlots.filter((s) => !s.hasDocument)

  const canManage =
    canManageMeetingRooms() ||
    (!!currentUserId && meeting?.organizer.id === currentUserId)

  const handleWorkflowChange = async (stepId: BookingWorkflowId) => {
    if (!meeting || !canManage) return
    try {
      if (stepId === 'cancelled') {
        await bookingMutation.mutateAsync({ meetingId: id, status: 'cancelled' })
        await statusMutation.mutateAsync({ meetingId: id, status: 'cancelled' })
      } else if (stepId === 'pending') {
        await bookingMutation.mutateAsync({ meetingId: id, status: 'pending' })
      } else if (stepId === 'confirmed') {
        await bookingMutation.mutateAsync({ meetingId: id, status: 'confirmed' })
      } else if (stepId === 'in_progress') {
        await bookingMutation.mutateAsync({ meetingId: id, status: 'confirmed' })
        await statusMutation.mutateAsync({ meetingId: id, status: 'in_progress' })
      } else if (stepId === 'completed') {
        await statusMutation.mutateAsync({ meetingId: id, status: 'completed' })
      }
      showSuccessToast('อัปเดตสถานะแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'อัปเดตสถานะไม่สำเร็จ')
    }
  }

  const handleDelete = async () => {
    if (!meeting) return
    const ok = window.confirm(
      `ต้องการลบการประชุม "${meeting.title}" ใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`
    )
    if (!ok) return
    try {
      await deleteMutation.mutateAsync(id)
      showSuccessToast('ลบการประชุมแล้ว')
      router.push('/dashboard/meetings')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    }
  }

  const handleExportCalendar = () => {
    if (!meeting) return
    const blob = buildIcsBlob(meeting)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-${meeting.id}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดรายละเอียดการประชุม...
      </div>
    )
  }

  if (isError || !meeting) {
    return (
      <div className={cn('flex flex-col gap-8 lg:gap-10')}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push('/dashboard/meetings')}
        >
          <ArrowLeft className="size-4" />
          กลับปฏิทิน
        </Button>
        <EmptyState
          icon={Calendar}
          title="ไม่พบการประชุม"
          description="รายการอาจถูกลบหรือลิงก์ไม่ถูกต้อง"
        />
      </div>
    )
  }

  const statusStyle = getMeetingStatusStyle(meeting.status)
  const roomLabel = meeting.room?.name ?? 'ไม่ระบุห้อง'
  const breadcrumbRoom = meeting.room?.name ?? 'ห้องประชุม'

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/meetings" className="font-medium hover:text-primary">
          {breadcrumbRoom}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground/90">รายละเอียดการประชุม</span>
      </nav>

      {/* Header card */}
      <section className={cn(surfaceCardClass(), "overflow-hidden p-5 sm:p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('border-orange-200 bg-orange-50 text-orange-800', statusStyle.chip)}
              >
                {activeStep === 'pending'
                  ? 'รอดำเนินการ'
                  : BOOKING_WORKFLOW.find((s) => s.id === activeStep)?.label}
              </Badge>
            </div>
            <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
              {meeting.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {roomLabel}
              {meeting.room?.code ? ` · ${meeting.room.code}` : ''} — {meetingTypeLabel(meeting.type)}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{formatMeetingDateShort(meeting.startAt)}</span>
              <span className="text-border">|</span>
              <span>
                {formatMeetingTime(meeting.startAt)} - {formatMeetingTime(meeting.endAt)}
              </span>
            </div>
            <Link
              href={`/dashboard/meetings/${id}/session`}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'mt-2 inline-flex gap-2 bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              <ListOrdered className="size-4" />
              เปิดหน้าการประชุมแบบเต็มระบบ
              {meeting.agendas.length > 0
                ? ` (วาระ 1–${meeting.agendas.length})`
                : ''}
            </Link>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setScheduleNextOpen(true)}
              >
                <CalendarPlus className="size-4 text-primary" />
                นัดครั้งต่อไป
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4 text-emerald-600" />
                แก้ไข
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="size-4 text-rose-600" />
                ลบ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportCalendar}
              >
                <Calendar className="size-4" />
                Export ปฏิทิน
              </Button>
              <Link
                href={`/dashboard/meetings/${id}/session`}
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'inline-flex gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                <FileText className="size-4" />
                ดูการประชุมแบบเต็มระบบ
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Left column */}
        <div className="space-y-4">
          <section className={cn(surfaceCardClass(), "p-4")}>
            <h2 className="mb-4 text-sm font-semibold text-foreground">สถานะการจอง</h2>
            <ol className="flex items-center justify-between gap-1">
              {BOOKING_WORKFLOW.map((step, i) => {
                const done = i < activeIndex
                const current = i === activeIndex
                return (
                  <li key={step.id} className="flex flex-1 flex-col items-center gap-1 text-center">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-xs font-bold',
                        done || current
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-muted-foreground/30 bg-muted text-muted-foreground'
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        'hidden text-[10px] leading-tight sm:block',
                        current ? 'font-semibold text-emerald-700' : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          {canManage && (
            <section className={cn(surfaceCardClass(), "p-4")}>
              <h2 className="mb-3 text-sm font-semibold text-foreground">เปลี่ยนสถานะ</h2>
              <div className="flex flex-wrap gap-2">
                {BOOKING_WORKFLOW.map((step) => (
                  <Button
                    key={step.id}
                    type="button"
                    size="sm"
                    variant={activeStep === step.id ? 'default' : 'outline'}
                    disabled={bookingMutation.isPending || statusMutation.isPending}
                    onClick={() => handleWorkflowChange(step.id)}
                  >
                    {step.label}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <section className={cn(surfaceCardClass(), "p-4")}>
            <h2 className="mb-2 text-sm font-semibold text-foreground">ผู้เข้าร่วม</h2>
            <p className="text-sm text-muted-foreground">
              ผู้จัด: <span className="font-medium text-foreground">{meeting.organizer.name}</span>
            </p>
            {meeting.participants.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {meeting.participants.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    {p.name}
                    {p.departmentName ? ` · ${p.departmentName}` : ''}
                  </li>
                ))}
                {meeting.participants.length > 5 && (
                  <li>และอีก {meeting.participants.length - 5} คน</li>
                )}
              </ul>
            )}
            <div className="mt-3">
              <MeetingManageParticipantsButton meetingId={meeting.id} meetingTitle={meeting.title} />
            </div>
          </section>

          {canManage && (
            <section className={cn(surfaceCardClass(), "p-4")}>
              <h2 className="mb-2 text-sm font-semibold text-foreground">การประชุมครั้งต่อไป</h2>
              <p className="text-sm text-muted-foreground">
                นัดรอบถัดไปโดยคัดลอกห้อง ผู้เข้าร่วม และช่วงเวลาเดิม (+7 วัน) จากการประชุมนี้
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full gap-2 bg-primary/10 text-primary hover:bg-primary/15"
                onClick={() => setScheduleNextOpen(true)}
              >
                <CalendarPlus className="size-4" />
                นัดการประชุมครั้งต่อไป
              </Button>
            </section>
          )}

          <section className={cn(surfaceCardClass(), "p-4")}>
            <h2 className="mb-2 text-sm font-semibold text-foreground">ประวัติการประชุม</h2>
            <p className="text-sm text-muted-foreground">
              มีทั้งหมด {roomHistory.length || historyData?.total || 0} รายการ
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2"
              onClick={() => setHistoryOpen((o) => !o)}
            >
              <ChevronDown className={cn('size-4 transition', historyOpen && 'rotate-180')} />
              เปิดดูข้อมูล
            </Button>
            {historyOpen && roomHistory.length > 0 && (
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto border-t pt-3 text-sm">
                {roomHistory.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/dashboard/meetings/${h.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {h.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatMeetingDateShort(h.startAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column — agenda */}
        <section id="meeting-agenda-section" className={cn(surfaceCardClass(), "p-5 sm:p-6")}>
          <h2 className="mb-5 text-base font-semibold text-foreground">สถานะวาระการประชุม</h2>

          <ol className="relative space-y-6 border-l-2 border-muted pl-6">
            {agendaTimeline.map((step) => (
              <li key={step.id} className="relative">
                <span
                  className={cn(
                    'absolute -left-[1.65rem] top-0.5 flex size-6 items-center justify-center rounded-full border-2 bg-card',
                    step.state === 'done' && 'border-emerald-500 bg-emerald-50',
                    step.state === 'current' && 'border-primary bg-primary/10',
                    step.state === 'upcoming' && 'border-muted-foreground/30'
                  )}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      step.state === 'done' && 'bg-emerald-500',
                      step.state === 'current' && 'bg-primary',
                      step.state === 'upcoming' && 'bg-muted-foreground/40'
                    )}
                  />
                </span>
                <p
                  className={cn(
                    'font-medium',
                    step.state === 'done' && 'text-emerald-800',
                    step.state === 'current' && 'text-foreground',
                    step.state === 'upcoming' && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
                {step.id === 'booked' && meeting.bookingStatus !== 'cancelled' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMeetingDateShort(meeting.startAt)} — บันทึกการจองแล้ว
                  </p>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-foreground">ความสมบูรณ์ระเบียบวาระ</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {agendaSlots.map((slot) => (
                <span
                  key={slot.orderNo}
                  className={cn(
                    'rounded-md border px-3 py-2 text-center text-xs font-medium',
                    slot.hasDocument
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  )}
                >
                  วาระที่ {slot.orderNo}{' '}
                  {slot.hasDocument ? 'มีเอกสารแล้ว' : 'ยังไม่มีเอกสาร'}
                </span>
              ))}
            </div>

            {missingAgendas.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
                วาระที่ {missingAgendas.map((s) => s.orderNo).join(', ')} ยังไม่มีเอกสารแนบ
                กรุณาอัปโหลดเอกสารก่อนกดบันทึกวาระ
              </div>
            )}

            {meeting.agendas.length > 0 && (
              <ul className="mt-4 space-y-2 rounded-lg border bg-muted/20 p-3 text-sm">
                {meeting.agendas
                  .sort((a, b) => a.orderNo - b.orderNo)
                  .map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-primary">{a.orderNo}.</span>
                      <span className="min-w-0 flex-1">
                        {a.title}
                        {a.presenterName ? ` — ${a.presenterName}` : ''}
                        {a.durationMinutes ? ` (${a.durationMinutes} นาที)` : ''}
                      </span>
                      {a.attachmentFileName && (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-1.5 py-1 text-xs">
                          <FileTypeIcon fileName={a.attachmentFileName} size="sm" />
                          <span className="max-w-[10rem] truncate text-foreground">
                            {a.attachmentFileName}
                          </span>
                        </span>
                      )}
                      {a.attachmentPath && (
                        <a
                          href={`${getApiUrl()}${a.attachmentPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          เปิด
                        </a>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {canManage && (
            <Button
              type="button"
              className="mt-6 w-full gap-2 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 sm:w-auto"
              variant="secondary"
              onClick={() => setAgendaOpen(true)}
            >
              <ListOrdered className="size-4" />
              ไปแนบวาระ
            </Button>
          )}

          {meeting.minutes.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold">รายงานการประชุม (PDF)</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {meeting.minutes.map((m) => (
                  <li key={m.id}>
                    {m.pdfPath ? (
                      <a
                        href={`${getApiUrl()}${m.pdfPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {m.summary ?? 'เปิดไฟล์ PDF'}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">ไม่มีไฟล์</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 rounded-lg border bg-muted/10 p-3">
            <MeetingScheduleTimestamp startAt={meeting.startAt} endAt={meeting.endAt} />
          </div>
        </section>
      </div>

      {canManage && (
        <>
          <MeetingCreateDialog
            sourceMeeting={meeting}
            open={scheduleNextOpen}
            onOpenChange={setScheduleNextOpen}
            allowOrganizer
            hideDefaultTrigger
            onCreated={(created) => router.push(`/dashboard/meetings/${created.id}`)}
          />
          <MeetingEditDialog meeting={meeting} open={editOpen} onOpenChange={setEditOpen} />
          <MeetingAgendaDialog meeting={meeting} open={agendaOpen} onOpenChange={setAgendaOpen} />
        </>
      )}
    </div>
  )
}
