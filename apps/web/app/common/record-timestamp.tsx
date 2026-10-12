'use client'

import { CalendarClock, Clock } from 'lucide-react'
import { cn } from '@/app/common/utils'
import {
  formatDateTimeThai,
  TIMESTAMP_LABELS,
  type TimestampLabelKey,
} from '@/app/common/datetime'

type RecordTimestampProps = {
  iso: string | null | undefined
  label?: TimestampLabelKey | string
  variant?: 'stacked' | 'inline' | 'compact' | 'premium'
  showRelative?: boolean
  secondaryIso?: string | null
  secondaryLabel?: TimestampLabelKey | string
  className?: string
}

export function RecordTimestamp({
  iso,
  label,
  variant = 'stacked',
  showRelative = true,
  secondaryIso,
  secondaryLabel,
  className,
}: RecordTimestampProps) {
  const primary = formatDateTimeThai(iso)
  const secondary = secondaryIso ? formatDateTimeThai(secondaryIso) : null
  const labelText =
    typeof label === 'string' ? label : label ? TIMESTAMP_LABELS[label] : undefined
  const secondaryLabelText =
    typeof secondaryLabel === 'string'
      ? secondaryLabel
      : secondaryLabel
        ? TIMESTAMP_LABELS[secondaryLabel]
        : undefined

  if (variant === 'premium') {
    return (
      <div
        className={cn(
          'rounded-xl border border-primary/10 bg-gradient-to-br from-white via-primary/[0.02] to-ha-green/[0.04] p-3 shadow-sm',
          className
        )}
        title={primary.isoLocal}
      >
        {labelText && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/80">
            {labelText}
          </p>
        )}
        {primary.weekday && (
          <p className="text-[11px] font-medium text-muted-foreground">{primary.weekday}</p>
        )}
        <p className="text-sm font-semibold tabular-nums text-foreground">{primary.date}</p>
        <p className="mt-0.5 text-xs font-medium tabular-nums text-primary">{primary.time}</p>
        {showRelative && primary.relative && (
          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {primary.relative}
          </span>
        )}
        {secondary && secondaryIso && secondaryLabelText && (
          <div className="mt-3 border-t border-border/60 pt-2">
            <p className="text-[10px] font-medium text-muted-foreground">{secondaryLabelText}</p>
            <p className="text-xs tabular-nums text-muted-foreground">{secondary.full}</p>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-1', className)} title={primary.isoLocal}>
        <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5 shrink-0 text-primary/70" aria-hidden />
          {labelText && <span className="font-semibold text-foreground/75">{labelText}</span>}
          {primary.weekday && <span className="text-muted-foreground/80">({primary.weekday})</span>}
          <span className="tabular-nums font-medium text-foreground/90">{primary.full}</span>
          {showRelative && primary.relative && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {primary.relative}
            </span>
          )}
        </span>
        {secondary && secondaryIso && secondaryLabelText && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium">{secondaryLabelText}</span>
            <span className="tabular-nums">{secondary.full}</span>
          </span>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('text-xs leading-snug', className)} title={primary.isoLocal}>
        {labelText && <p className="font-semibold text-primary/80">{labelText}</p>}
        <p className="tabular-nums text-foreground">
          {primary.weekday && <span className="text-muted-foreground">{primary.weekday} · </span>}
          {primary.full}
        </p>
        {showRelative && primary.relative && (
          <p className="text-[10px] font-medium text-primary">{primary.relative}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-white/90 px-3 py-2.5 shadow-sm"
        title={primary.isoLocal}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-ha-green/10 text-primary">
          <Clock className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {labelText && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {labelText}
            </p>
          )}
          {primary.weekday && (
            <p className="text-[11px] text-muted-foreground">{primary.weekday}</p>
          )}
          <p className="text-sm font-semibold tabular-nums">{primary.date}</p>
          <p className="text-xs font-medium tabular-nums text-primary">{primary.time}</p>
          {showRelative && primary.relative && (
            <p className="mt-1 text-[10px] font-semibold text-primary">{primary.relative}</p>
          )}
        </div>
      </div>
      {secondary && secondaryIso && secondaryLabelText && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/15 px-3 py-2 pl-11">
          <p className="text-[10px] font-medium text-muted-foreground">{secondaryLabelText}</p>
          <p className="text-xs tabular-nums">{secondary.full}</p>
        </div>
      )}
    </div>
  )
}

export function MeetingScheduleTimestamp({
  startAt,
  endAt,
  className,
}: {
  startAt: string
  endAt: string
  className?: string
}) {
  const start = formatDateTimeThai(startAt)
  const endTime = formatDateTimeThai(endAt).time

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-xl border border-sky-200/70 bg-gradient-to-r from-sky-50/90 to-blue-50/50 px-3 py-2 text-xs shadow-sm',
        className
      )}
      title={`${start.isoLocal} – ${formatDateTimeThai(endAt).isoLocal}`}
    >
      <CalendarClock className="size-4 shrink-0 text-sky-700" aria-hidden />
      <div className="min-w-0">
        <p className="font-bold text-sky-900/90">{TIMESTAMP_LABELS.scheduled}</p>
        <p className="tabular-nums text-sky-800">
          {start.weekday && `${start.weekday} · `}
          {start.date} · {start.time} – {endTime}
        </p>
      </div>
    </div>
  )
}
