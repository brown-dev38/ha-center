'use client'

import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/app/common/utils'
import { formatTimerDisplay, TIMER_PRESETS_MIN } from '@/app/meetings/meeting-session'

export type TimerRunState = 'idle' | 'running' | 'paused'

type Props = {
  currentOrderNo: number
  totalAgendas: number
  secondsLeft: number
  initialSeconds: number
  runState: TimerRunState
  autoAdvance: boolean
  canControl: boolean
  /** ผู้เข้าร่วม — เห็นเวลาแต่ไม่มีปุ่มควบคุม */
  readOnly?: boolean
  onAutoAdvanceChange: (v: boolean) => void
  onPreset: (minutes: number) => void
  onStart: () => void
  onPause: () => void
  onEnd: () => void
  onPrev: () => void
  onNext: () => void
  onReset: () => void
}

export function MeetingPresentationTimer({
  currentOrderNo,
  totalAgendas,
  secondsLeft,
  initialSeconds,
  runState,
  autoAdvance,
  canControl,
  readOnly = false,
  onAutoAdvanceChange,
  onPreset,
  onStart,
  onPause,
  onEnd,
  onPrev,
  onNext,
  onReset,
}: Props) {
  const progress =
    initialSeconds > 0 ? Math.min(100, ((initialSeconds - secondsLeft) / initialSeconds) * 100) : 0

  return (
    <aside className="print:hidden lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white shadow-xl shadow-primary/10">
        <div className="border-b border-white/10 bg-primary/20 px-5 py-4">
          <div className="flex items-center gap-2 text-primary-100">
            <Monitor className="size-5 text-emerald-300" />
            <h2 className="text-sm font-semibold tracking-wide">ระบบเวลาการนำเสนอ</h2>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs font-medium text-slate-300">ตอนนี้กำลังนำเสนอ</p>
            <p className="mt-1 text-lg font-bold text-emerald-300">
              วาระที่ {currentOrderNo}
              <span className="text-sm font-normal text-slate-400">
                {' '}
                / {totalAgendas}
              </span>
            </p>

            <div
              className={cn(
                'mt-4 font-mono text-5xl font-bold tabular-nums tracking-tight transition-colors',
                runState === 'running' && secondsLeft <= 60 && 'text-amber-300',
                runState === 'running' && secondsLeft <= 15 && 'animate-pulse text-rose-300',
                runState !== 'running' && 'text-white'
              )}
            >
              {formatTimerDisplay(secondsLeft)}
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-primary transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            {canControl && (
              <button
                type="button"
                onClick={onEnd}
                className="mt-4 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/20"
              >
                จบการนำเสนอ
              </button>
            )}
          </div>

          {readOnly && !canControl && (
            <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-slate-300">
              โหมดดูเวลา — ไม่สามารถกดควบคุมได้
            </p>
          )}

          {canControl && (
            <>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  ตั้งเวลาเร็ว (นาที)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIMER_PRESETS_MIN.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => onPreset(min)}
                      className="rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-bold text-white transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
                    >
                      {min}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => onAutoAdvanceChange(e.target.checked)}
                  className="size-4 rounded border-white/30 accent-emerald-500"
                />
                สลับอัตโนมัติเมื่อหมดเวลา
              </label>

              <div className="grid grid-cols-2 gap-2">
                {runState !== 'running' ? (
                  <button
                    type="button"
                    onClick={onStart}
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500'
                    )}
                  >
                    <Play className="size-3.5" />
                    เริ่ม
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPause}
                    className={cn(
                      buttonVariants({ size: 'sm', variant: 'secondary' }),
                      'gap-1.5 bg-white/15 text-white hover:bg-white/25'
                    )}
                  >
                    <Pause className="size-3.5" />
                    หยุด
                  </button>
                )}
                <button
                  type="button"
                  onClick={onReset}
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'outline' }),
                    'gap-1.5 border-white/20 bg-transparent text-white hover:bg-white/10'
                  )}
                >
                  <RotateCcw className="size-3.5" />
                  รีเซ็ต
                </button>
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentOrderNo <= 1}
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'outline' }),
                    'gap-1 border-white/20 bg-transparent text-white hover:bg-white/10 disabled:opacity-40'
                  )}
                >
                  <ChevronLeft className="size-3.5" />
                  ก่อนหน้า
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentOrderNo >= totalAgendas}
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'outline' }),
                    'gap-1 border-white/20 bg-transparent text-white hover:bg-white/10 disabled:opacity-40'
                  )}
                >
                  ถัดไป
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        <p className="border-t border-white/10 px-4 py-3 text-[10px] leading-relaxed text-slate-400">
          {readOnly
            ? 'เวลานำเสนอควบคุมโดยผู้จัดการประชุม — หน้าจอจะอัปเดตตามการดำเนินการของผู้นำ'
            : 'ระบบจะแสดงการนำเสนอตามวาระบนหน้าจอ — ผู้จัดการประชุมหรือผู้ดูแลสามารถควบคุมเวลาได้'}
        </p>
      </div>
    </aside>
  )
}
