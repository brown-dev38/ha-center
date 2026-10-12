'use client'

import { useEffect, useState } from 'react'
import { formatDateTimeThai } from '@/app/common/datetime'
import { cn } from '@/app/common/utils'

export type UpdateFreshness = 'live' | 'today' | 'recent' | 'current' | 'aging' | 'stale' | 'none'

type DocumentUpdateStatusProps = {
  updatedAt?: string | null
  /** ถ้าไม่มี updatedAt ใช้วันที่อัปโหลด/สร้างเป็น fallback */
  fallbackAt?: string | null
  /** เวลาสร้างเดิม — ถ้าใกล้เคียง updatedAt จะถือว่ายังไม่เคยอัปเดตซ้ำ */
  createdAt?: string | null
  className?: string
  compact?: boolean
}

const FRESHNESS_META: Record<
  Exclude<UpdateFreshness, 'none'>,
  { label: string; tone: string; dot: string }
> = {
  live: {
    label: 'เพิ่งอัปเดต',
    tone: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-950',
    dot: 'bg-emerald-500',
  },
  today: {
    label: 'อัปเดตวันนี้',
    tone: 'border-sky-200/70 bg-sky-50/80 text-sky-950',
    dot: 'bg-sky-500',
  },
  recent: {
    label: 'อัปเดตสัปดาห์นี้',
    tone: 'border-indigo-200/60 bg-indigo-50/70 text-indigo-950',
    dot: 'bg-indigo-500',
  },
  current: {
    label: 'เป็นปัจจุบัน',
    tone: 'border-slate-200/80 bg-slate-50/90 text-slate-800',
    dot: 'bg-slate-500',
  },
  aging: {
    label: 'ควรทบทวน',
    tone: 'border-amber-200/80 bg-amber-50/90 text-amber-950',
    dot: 'bg-amber-500',
  },
  stale: {
    label: 'ค้างนาน',
    tone: 'border-rose-200/70 bg-rose-50/80 text-rose-950',
    dot: 'bg-rose-500',
  },
}

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** ถ้าอัปเดตห่างจากสร้างไม่ถึง 2 นาที ให้ใช้เวลาสร้างเป็นหลัก (ยังไม่ใช่ "อัปเดตซ้ำ") */
export function resolveDocumentUpdatedAt(
  updatedAt?: string | null,
  fallbackAt?: string | null,
  createdAt?: string | null
): string | null {
  const updated = parseIso(updatedAt)
  const created = parseIso(createdAt)
  const fallback = parseIso(fallbackAt)

  if (updated && created) {
    const deltaMs = Math.abs(updated.getTime() - created.getTime())
    // บันทึกครั้งแรก / seed ที่ updated≈created ไม่ควรโชว์เป็น "เพิ่งอัปเดต" จาก noise
    if (deltaMs < 120_000) {
      return (fallback ?? created).toISOString()
    }
    return updated.toISOString()
  }

  if (updated) return updated.toISOString()
  if (fallback) return fallback.toISOString()
  if (created) return created.toISOString()
  return null
}

export function getUpdateFreshness(
  iso: string | null | undefined,
  nowMs: number = Date.now()
): UpdateFreshness {
  const d = parseIso(iso)
  if (!d) return 'none'
  const diffMs = nowMs - d.getTime()
  if (diffMs < -60_000) return 'live' // clock skew เล็กน้อย
  const mins = diffMs / 60_000
  const hours = mins / 60
  const days = hours / 24

  if (mins < 60) return 'live'
  if (days < 1) return 'today'
  if (days < 7) return 'recent'
  if (days < 30) return 'current'
  if (days < 90) return 'aging'
  return 'stale'
}

/**
 * เวลาที่ควรแสดงเป็น "อัปเดตเนื้อหา" ของเอกสารทั่วไป
 * — ถ้า updatedAt แทบไม่ต่างจากสร้าง/อัปโหลด → ใช้เวลาไฟล์
 * — ถ้ามีการแก้ทีหลังจริง → ใช้ updatedAt
 */
export function resolveContentActivityAt(input: {
  updatedAt?: string | null
  createdAt?: string | null
  versionCreatedAt?: string | null
}): string | null {
  return resolveDocumentUpdatedAt(
    input.updatedAt,
    input.versionCreatedAt ?? input.createdAt,
    input.createdAt
  )
}

export function DocumentUpdateStatus({
  updatedAt,
  fallbackAt,
  createdAt,
  className,
  compact = false,
}: DocumentUpdateStatusProps) {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const iso = resolveDocumentUpdatedAt(updatedAt, fallbackAt, createdAt)
  const freshness = getUpdateFreshness(iso, nowMs)

  if (freshness === 'none' || !iso) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/15 px-2.5 py-1 text-[11px] text-muted-foreground',
          className
        )}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/35" aria-hidden />
        <span>ยังไม่มีประวัติอัปเดต</span>
      </div>
    )
  }

  const meta = FRESHNESS_META[freshness]
  const formatted = formatDateTimeThai(iso)

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1',
        meta.tone,
        className
      )}
      title={formatted.isoLocal || undefined}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} aria-hidden />

      <span className="text-[11px] font-semibold tracking-tight">{meta.label}</span>

      <span className="text-[10px] text-current/35" aria-hidden>
        |
      </span>

      <span className="truncate text-[11px] font-medium text-current/80">
        {formatted.relative ?? formatted.date}
      </span>

      {!compact && (
        <>
          <span className="text-[10px] text-current/35" aria-hidden>
            |
          </span>
          <span className="tabular-nums text-[11px] text-current/70">
            {formatted.date}
            <span className="text-current/40"> · </span>
            {formatted.time.replace(' น.', '')}
          </span>
        </>
      )}

      {compact && formatted.relative && (
        <span className="hidden tabular-nums text-[10px] text-current/55 sm:inline">
          {formatted.date}
        </span>
      )}
    </div>
  )
}
