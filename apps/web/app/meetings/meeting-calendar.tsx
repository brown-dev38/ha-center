'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Users,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/app/common/utils'
import { MeetingScheduleTimestamp } from '@/app/common/record-timestamp'
import { MeetingStatusBadge } from '@/app/meetings/meeting-status-badge'
import { MeetingStatusLegend } from '@/app/meetings/meeting-status-badge'
import { MeetingManageParticipantsButton } from '@/app/meetings/meeting-manage-participants-button'
import { MeetingStatusSelect } from '@/app/meetings/meeting-status-select'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import {
  buildMonthGrid,
  formatMeetingDateLong,
  formatMeetingTime,
  formatMonthYear,
  getMeetingStatusStyle,
  groupMeetingsByDay,
  isSameCalendarDay,
  TH_WEEKDAYS_SHORT,
  toDateKey,
  type MeetingListItem,
} from '@/app/meetings/meetings'

type MeetingCalendarProps = {
  meetings: MeetingListItem[]
  isLoading?: boolean
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

function MeetingEventChip({
  meeting,
  compact,
}: {
  meeting: MeetingListItem
  compact?: boolean
}) {
  const style = getMeetingStatusStyle(meeting.status)
  return (
    <Link
      href={`/dashboard/meetings/${meeting.id}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'block truncate rounded-md border px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight transition hover:opacity-90 sm:text-[11px]',
        style.chip,
        compact && 'px-1 py-px'
      )}
      title={`${meeting.title} · ${formatMeetingTime(meeting.startAt)} — คลิกดูรายละเอียด`}
    >
      {!compact && (
        <span className="mr-1 opacity-70">{formatMeetingTime(meeting.startAt)}</span>
      )}
      {meeting.title}
    </Link>
  )
}

function MeetingTimelineStatus({
  meetingId,
  status,
}: {
  meetingId: string
  status: string
}) {
  const { canManageMeetingRooms } = usePermissions()

  if (canManageMeetingRooms()) {
    return (
      <MeetingStatusSelect
        meetingId={meetingId}
        currentStatus={status}
        compact
        className="shrink-0"
      />
    )
  }

  return <MeetingStatusBadge status={status} />
}

function DayTimeline({ meetings }: { meetings: MeetingListItem[] }) {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-12 text-center">
        <CalendarDays className="mb-2 size-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">ไม่มีการประชุมในวันนี้</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {meetings.map((m) => {
        const style = getMeetingStatusStyle(m.status)
        return (
          <li
            key={m.id}
            className={cn(
              'min-w-0 overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-sm transition hover:shadow-md',
              'border-l-4',
              style.border
            )}
          >
            <div className="space-y-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/meetings/${m.id}`}
                  className="block break-words font-semibold leading-snug text-foreground hover:text-primary hover:underline"
                >
                  {m.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs capitalize text-muted-foreground">{m.type}</span>
                  <MeetingTimelineStatus meetingId={m.id} status={m.status} />
                </div>
              </div>

              <MeetingScheduleTimestamp startAt={m.startAt} endAt={m.endAt} className="w-full" />

              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                {m.room && (
                  <span className="inline-flex min-w-0 items-start gap-1.5 break-words">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>
                      {m.room.name}
                      {m.room.location && (
                        <span className="text-xs opacity-80"> ({m.room.location})</span>
                      )}
                    </span>
                  </span>
                )}
                {m.participantsCount !== undefined && (
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    <Users className="size-3.5 shrink-0 text-primary" />
                    {m.participantsCount} คน
                  </span>
                )}
              </div>

              {m.organizer?.name && (
                <p className="break-words text-xs text-muted-foreground">ผู้จัด: {m.organizer.name}</p>
              )}

              <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-2.5">
                <Link
                  href={`/dashboard/meetings/${m.id}`}
                  className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
                >
                  <Eye className="size-3.5" />
                  รายละเอียด
                </Link>
                <MeetingManageParticipantsButton meetingId={m.id} meetingTitle={m.title} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function MeetingCalendar({
  meetings,
  isLoading,
  year,
  month,
  onMonthChange,
}: MeetingCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(today))

  const byDay = useMemo(() => groupMeetingsByDay(meetings), [meetings])
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month])

  const selectedMeetings = byDay.get(selectedKey) ?? []
  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [selectedKey])

  const monthMeetingCount = meetings.length

  const goMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1)
    onMonthChange(next.getFullYear(), next.getMonth() + 1)
  }

  const goToday = () => {
    const now = new Date()
    onMonthChange(now.getFullYear(), now.getMonth() + 1)
    setSelectedKey(toDateKey(now))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
            <CalendarDays className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {formatMonthYear(year, month)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {monthMeetingCount} การประชุมในเดือนนี้
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => goMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={goToday}>
            วันนี้
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => goMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <MeetingStatusLegend />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className={cn(surfaceCardClass(), "overflow-hidden")}>
          <div className="grid grid-cols-7 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
            {TH_WEEKDAYS_SHORT.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-primary/80"
              >
                {day}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid min-h-[280px] place-items-center p-8 text-sm text-muted-foreground">
              กำลังโหลดปฏิทิน...
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
              {grid.map((cell) => {
                const dayMeetings = byDay.get(cell.key) ?? []
                const isToday = isSameCalendarDay(cell.date, today)
                const isSelected = cell.key === selectedKey
                const visible = dayMeetings.slice(0, 2)
                const more = dayMeetings.length - visible.length

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedKey(cell.key)}
                    className={cn(
                      'min-h-[5.5rem] p-1.5 text-left transition sm:min-h-[6.25rem] sm:p-2',
                      'hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset',
                      !cell.inCurrentMonth && 'bg-muted/15',
                      isSelected && 'bg-primary/8 ring-1 ring-inset ring-primary/25',
                      isToday && !isSelected && 'bg-sky-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full text-sm font-semibold',
                          isToday && 'bg-primary text-primary-foreground shadow-sm',
                          !isToday && cell.inCurrentMonth && 'text-foreground',
                          !cell.inCurrentMonth && 'text-muted-foreground/50'
                        )}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayMeetings.length > 0 && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          {dayMeetings.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {visible.map((m) => (
                        <MeetingEventChip key={m.id} meeting={m} compact />
                      ))}
                      {more > 0 && (
                        <p className="px-0.5 text-[10px] font-medium text-primary">+{more} รายการ</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <aside className={cn(surfaceCardClass(), "flex flex-col bg-gradient-to-b from-card to-primary/[0.03] p-5")}>
          <h3 className="border-b border-border/60 pb-3 text-sm font-semibold uppercase tracking-wide text-primary">
            รายการวันที่เลือก
          </h3>
          <p className="mt-3 text-base font-medium text-foreground">
            {formatMeetingDateLong(selectedDate)}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {selectedMeetings.length} การประชุม
          </p>
          <div className="max-h-[min(32rem,60vh)] min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
            <DayTimeline meetings={selectedMeetings} />
          </div>
        </aside>
      </div>
    </div>
  )
}
