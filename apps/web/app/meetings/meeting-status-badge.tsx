'use client'

import { cn } from '@/app/common/utils'
import {
  getMeetingStatusLabel,
  getMeetingStatusStyle,
  type MeetingStatusKey,
} from '@/app/meetings/meetings'

type MeetingStatusBadgeProps = {
  status: string
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

export function MeetingStatusBadge({
  status,
  size = 'sm',
  showDot = true,
  className,
}: MeetingStatusBadgeProps) {
  const style = getMeetingStatusStyle(status)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold',
        style.chip,
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      {showDot && <span className={cn('size-2 rounded-full', style.dot)} aria-hidden />}
      {getMeetingStatusLabel(status)}
    </span>
  )
}

export function MeetingStatusLegend() {
  const keys: MeetingStatusKey[] = ['scheduled', 'in_progress', 'completed', 'cancelled']
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-border/80 bg-white/80 px-4 py-3">
      {keys.map((key) => (
        <MeetingStatusBadge key={key} status={key} size="sm" />
      ))}
    </div>
  )
}
