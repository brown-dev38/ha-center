'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, ChevronRight, Eye } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/app/empty-state'
import { MeetingScheduleTimestamp } from '@/app/common/record-timestamp'
import { MeetingStatusBadge } from '@/app/meetings/meeting-status-badge'
import { useMeetings } from '@/hooks/use-meetings'
import { getMeetingStatusStyle } from '@/app/meetings/meetings'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function MeetingRoomMeetingsView() {
  const params = useParams<{ roomId: string }>()
  const roomId = typeof params.roomId === 'string' ? params.roomId : ''
  const router = useRouter()

  const { data, isLoading, isError } = useMeetings({ roomId })

  const meetings = Array.isArray(data) ? data : []
  const room = meetings[0]?.room

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/meetings?view=rooms" className="font-medium hover:text-primary">
          ห้องประชุม
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground/90">รายการการประชุมในห้อง</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push('/dashboard/meetings?view=rooms')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {room?.name ?? 'ห้องประชุม'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {room?.code ? `${room.code} · ` : ''}
              {room?.location ?? 'เลือกการประชุมเพื่อดูรายละเอียดการตั้งค่าและวาระ'}
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          กำลังโหลดการประชุมในห้องนี้...
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          โหลดรายการประชุมไม่สำเร็จ
        </p>
      )}

      {!isLoading && !isError && meetings.length === 0 && (
        <EmptyState
          icon={Building2}
          title="ยังไม่มีการประชุมในห้องนี้"
          description="กลับไปนัดประชุมใหม่หรือเลือกเดือนอื่นในปฏิทิน"
        />
      )}

      {!isLoading && meetings.length > 0 && (
        <ul className="grid gap-3">
          {meetings.map((m) => {
            const style = getMeetingStatusStyle(m.status)
            return (
              <li
                key={m.id}
                className={cn(surfaceCardClass(), 'border-l-4 p-4', style.border)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{m.title}</p>
                    <div className="mt-3">
                      <MeetingScheduleTimestamp startAt={m.startAt} endAt={m.endAt} />
                    </div>
                    {m.organizer?.name && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        ผู้จัด: {m.organizer.name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <MeetingStatusBadge status={m.status} />
                    <Link
                      href={`/dashboard/meetings/${m.id}`}
                      className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
                    >
                      <Eye className="size-4" />
                      ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
