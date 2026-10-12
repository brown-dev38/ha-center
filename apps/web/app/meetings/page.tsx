'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { Building2, CalendarDays, List } from 'lucide-react'
import { useMeetings } from '@/hooks/use-meetings'
import { usePermissions } from '@/hooks/use-permissions'
import { MeetingCalendar } from '@/app/meetings/meeting-calendar'
import { MeetingCreateDialog } from '@/app/meetings/meeting-create-dialog'
import { MeetingRoomManager } from '@/app/meetings/meeting-room-manager'
import { MeetingStatusBadge } from '@/app/meetings/meeting-status-badge'
import { MeetingManageParticipantsButton } from '@/app/meetings/meeting-manage-participants-button'
import { MeetingStatusSelect } from '@/app/meetings/meeting-status-select'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { Button, buttonVariants } from '@/components/ui/button'
import { MeetingScheduleTimestamp } from '@/app/common/record-timestamp'
import { getMeetingStatusStyle, type MeetingListItem } from '@/app/meetings/meetings'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

type ViewMode = 'calendar' | 'list' | 'rooms'

export default function MeetingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          กำลังโหลดปฏิทินการประชุม...
        </div>
      }
    >
      <MeetingsPageContent />
    </Suspense>
  )
}

function MeetingsPageContent() {
  const searchParams = useSearchParams()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [view, setView] = useState<ViewMode>('calendar')
  const { canManageMeetingRooms, roleLabel } = usePermissions()

  useEffect(() => {
    const v = searchParams.get('view')
    if (v === 'rooms' || v === 'list' || v === 'calendar') {
      setView(v)
    }
  }, [searchParams])

  const { data, isLoading, isError } = useMeetings({ month, year })
  const meetings = (Array.isArray(data) ? data : []) as MeetingListItem[]

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="meetings"
        title="ปฏิทินการประชุม"
        description="นัดประชุม จองห้อง และติดตามสถานะ — คลิกชื่อการประชุมเพื่อเปิดรายละเอียด"
      >
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} showRooms={canManageMeetingRooms()} />
          <MeetingCreateDialog />
        </div>
      </AdminEditablePageHeader>

      {roleLabel && (
        <p className="text-xs text-muted-foreground">
          บทบาท: {roleLabel}
          {canManageMeetingRooms()
            ? ' — จัดการห้องและนัดประชุมได้'
            : ' — ดูปฏิทินอย่างเดียว'}
        </p>
      )}

      {isError && view !== 'rooms' && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          โหลดข้อมูลการประชุมไม่สำเร็จ
        </p>
      )}

      {view === 'calendar' && (
        <MeetingCalendar
          meetings={meetings}
          isLoading={isLoading}
          onMonthChange={(y, m) => {
            setYear(y)
            setMonth(m)
          }}
          year={year}
          month={month}
        />
      )}

      {view === 'list' && <MeetingListView meetings={meetings} isLoading={isLoading} />}

      {view === 'rooms' && canManageMeetingRooms() && <MeetingRoomManager />}

      {view === 'rooms' && canManageMeetingRooms() && (
        <p className="text-xs text-muted-foreground">
          คลิกชื่อห้องหรือไอคอนรูปตาเพื่อดูรายการประชุม แล้วกด「ดูรายละเอียด」เพื่อเปิดหน้าตั้งค่าการประชุม
        </p>
      )}
    </div>
  )
}

function ViewToggle({
  view,
  onViewChange,
  showRooms,
}: {
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  showRooms: boolean
}) {
  const items: { id: ViewMode; label: string; icon: typeof CalendarDays }[] = [
    { id: 'calendar', label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'list', label: 'รายการ', icon: List },
  ]
  if (showRooms) items.push({ id: 'rooms', label: 'ห้องประชุม', icon: Building2 })

  return (
    <div className="flex rounded-lg border border-border bg-white p-1">
      {items.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          size="sm"
          variant={view === id ? 'default' : 'ghost'}
          className="gap-1.5"
          onClick={() => onViewChange(id)}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}

function MeetingListView({
  meetings,
  isLoading,
}: {
  meetings: MeetingListItem[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลด...
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="ไม่มีการประชุมในเดือนนี้"
        description="เลือกเดือนอื่นหรือกดนัดประชุมเพื่อเพิ่มรายการ"
      />
    )
  }

  return (
    <div className="grid gap-3">
      {meetings.map((m) => {
        const style = getMeetingStatusStyle(m.status)
        return (
          <div
            key={m.id}
            className={cn(surfaceCardClass(), 'border-l-4 p-4', style.border)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/meetings/${m.id}`}
                  className="font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {m.title}
                </Link>
                <div className="mt-3">
                  <MeetingScheduleTimestamp startAt={m.startAt} endAt={m.endAt} />
                </div>
                {m.room && <p className="mt-2 text-sm text-muted-foreground">{m.room.name}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <MeetingStatusBadge status={m.status} size="md" />
                <div className="flex flex-wrap justify-end gap-1">
                  <Link
                    href={`/dashboard/meetings/${m.id}`}
                    className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                  >
                    <Eye className="size-4" />
                    ดูรายละเอียด
                  </Link>
                  <MeetingManageParticipantsButton meetingId={m.id} meetingTitle={m.title} />
                  <MeetingStatusSelect meetingId={m.id} currentStatus={m.status} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
