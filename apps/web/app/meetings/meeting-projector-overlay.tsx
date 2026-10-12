'use client'

import { useEffect, useState } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  subscribeMeetingSessionState,
  type MeetingSessionSyncPayload,
} from '@/app/meetings/meeting-session-sync'
import { formatTimerDisplay } from '@/app/meetings/meeting-session'
import { cn } from '@/app/common/utils'
import type { TimerRunState } from '@/app/meetings/meeting-presentation-timer'

type Props = {
  meetingId: string
  onClose?: () => void
  standalone?: boolean
  initial?: MeetingSessionSyncPayload | null
}

const emptyPayload: MeetingSessionSyncPayload = {
  agendaIndex: 0,
  currentOrderNo: 1,
  secondsLeft: 300,
  initialSeconds: 300,
  runState: 'idle',
  meetingTitle: 'การประชุม',
  agendaTitle: 'ระเบียบวาระที่ 1',
  agendaContent: '',
  updatedAt: 0,
}

export function MeetingProjectorOverlay({
  meetingId,
  onClose,
  standalone = false,
  initial,
}: Props) {
  const [sync, setSync] = useState<MeetingSessionSyncPayload>(initial ?? emptyPayload)
  const [waiting, setWaiting] = useState(!initial)

  useEffect(() => {
    return subscribeMeetingSessionState(meetingId, (payload) => {
      setSync(payload)
      setWaiting(false)
    })
  }, [meetingId])

  useEffect(() => {
    if (initial) {
      setSync(initial)
      setWaiting(false)
    }
  }, [initial])

  const runState = sync.runState as TimerRunState
  const progress =
    sync.initialSeconds > 0
      ? Math.min(100, ((sync.initialSeconds - sync.secondsLeft) / sync.initialSeconds) * 100)
      : 0

  const [isFullscreen, setIsFullscreen] = useState(false)

  const requestFs = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const exitFs = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  }

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    if (standalone) requestFs()
    return () => {
      if (standalone && document.fullscreenElement) exitFs()
    }
  }, [standalone])

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-white text-foreground',
        !standalone && 'fixed inset-0 z-[200]'
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-6 py-4 shadow-sm sm:px-10">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            ระบบการประชุมผู้บริหาร
          </p>
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
            {sync.meetingTitle}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => (document.fullscreenElement ? exitFs() : requestFs())}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
            <span className="hidden sm:inline">เต็มจอ</span>
          </button>
          {!standalone && onClose && (
            <button
              type="button"
              onClick={() => {
                exitFs()
                onClose()
              }}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
            >
              <X className="size-4" />
              ปิดโปรเจคเตอร์
            </button>
          )}
        </div>
      </header>

      <div className="grid flex-1 gap-8 bg-white p-6 sm:grid-cols-[1fr_auto] sm:p-10 lg:gap-12">
        <section className="flex min-h-0 flex-col justify-center">
          {waiting ? (
            <p className="text-center text-xl text-muted-foreground">
              รอสัญญาณจากผู้ควบคุมการประชุม...
              <br />
              <span className="mt-2 block text-sm text-muted-foreground/80">
                เปิดหน้าควบคุมและกด 「โหมดโปรเจคเตอร์」 หรือเริ่มจับเวลา
              </span>
            </p>
          ) : (
            <>
              <p className="inline-flex w-fit rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                กำลังนำเสนอ วาระที่ {sync.currentOrderNo}
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                {sync.agendaTitle}
              </h2>
              {sync.agendaContent.trim() ? (
                <p className="mt-6 max-w-4xl text-lg leading-relaxed text-foreground/90 sm:text-xl lg:text-2xl">
                  {sync.agendaContent}
                </p>
              ) : (
                <p className="mt-6 text-lg text-muted-foreground">—</p>
              )}
            </>
          )}
        </section>

        <aside className="flex flex-col items-center justify-center sm:min-w-[280px] lg:min-w-[340px]">
          <div className="w-full rounded-3xl border-2 border-primary/20 bg-slate-50 p-8 text-center shadow-lg">
            <p className="text-sm font-medium text-muted-foreground">เวลาที่เหลือ</p>
            <div
              className={cn(
                'mt-4 font-mono text-7xl font-bold tabular-nums tracking-tight text-foreground sm:text-8xl lg:text-9xl',
                runState === 'running' && sync.secondsLeft <= 60 && 'text-amber-600',
                runState === 'running' && sync.secondsLeft <= 15 && 'animate-pulse text-rose-600'
              )}
            >
              {formatTimerDisplay(sync.secondsLeft)}
            </div>
            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {runState === 'running'
                ? 'กำลังจับเวลา'
                : runState === 'paused'
                  ? 'หยุดชั่วคราว'
                  : 'รอเริ่มนำเสนอ'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
