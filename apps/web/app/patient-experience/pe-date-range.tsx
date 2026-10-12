'use client'

import { CalendarDays, RotateCcw } from 'lucide-react'
import { cn } from '@/app/common/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type PeDateRange = {
  from: string
  to: string
}

/** แสดงวัน/เดือน/ปี แบบไทย (พ.ศ.) เช่น 15/01/2569 */
export function formatThaiDateDmy(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '—'
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatThaiDateRangeLabel(from: string, to: string): string {
  if (!from && !to) return 'ทุกช่วงเวลา'
  if (from && to) return `${formatThaiDateDmy(from)} – ${formatThaiDateDmy(to)}`
  if (from) return `ตั้งแต่ ${formatThaiDateDmy(from)}`
  return `ถึง ${formatThaiDateDmy(to)}`
}

type PeDateRangeFilterProps = {
  value: PeDateRange
  onChange: (next: PeDateRange) => void
  /** ช่วงข้อมูลจริง (ใช้เป็น min/max แนะนำ) */
  dataMin?: string
  dataMax?: string
  disabled?: boolean
  className?: string
}

export function PeDateRangeFilter({
  value,
  onChange,
  dataMin,
  dataMax,
  disabled,
  className,
}: PeDateRangeFilterProps) {
  const swapIfNeeded = (from: string, to: string): PeDateRange => {
    if (from && to && from > to) return { from: to, to: from }
    return { from, to }
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-slate-600">เลือกช่วงเวลา</Label>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <CalendarDays className="size-3" />
          วัน/เดือน/ปี
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="space-y-1">
          <Label htmlFor="pe-date-from" className="text-[11px] font-medium text-slate-500">
            วันที่เริ่มต้น
          </Label>
          <Input
            id="pe-date-from"
            type="date"
            lang="th-TH"
            disabled={disabled}
            value={value.from}
            min={dataMin || undefined}
            max={value.to || dataMax || undefined}
            onChange={(e) => onChange(swapIfNeeded(e.target.value, value.to))}
            className="h-10 bg-white font-medium tabular-nums"
          />
          {value.from ? (
            <p className="text-[11px] text-slate-500">{formatThaiDateDmy(value.from)}</p>
          ) : (
            <p className="text-[11px] text-slate-400">ไม่จำกัดวันเริ่ม</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="pe-date-to" className="text-[11px] font-medium text-slate-500">
            วันที่สิ้นสุด
          </Label>
          <Input
            id="pe-date-to"
            type="date"
            lang="th-TH"
            disabled={disabled}
            value={value.to}
            min={value.from || dataMin || undefined}
            max={dataMax || undefined}
            onChange={(e) => onChange(swapIfNeeded(value.from, e.target.value))}
            className="h-10 bg-white font-medium tabular-nums"
          />
          {value.to ? (
            <p className="text-[11px] text-slate-500">{formatThaiDateDmy(value.to)}</p>
          ) : (
            <p className="text-[11px] text-slate-400">ไม่จำกัดวันสิ้นสุด</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2">
        <p className="text-[11px] leading-snug text-slate-600">
          <span className="font-semibold text-slate-800">ช่วงที่เลือก:</span>{' '}
          {formatThaiDateRangeLabel(value.from, value.to)}
        </p>
        {(value.from || value.to) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 shrink-0 gap-1 px-2 text-[11px] text-slate-500"
            onClick={() => onChange({ from: '', to: '' })}
          >
            <RotateCcw className="size-3" />
            ล้าง
          </Button>
        )}
      </div>
    </div>
  )
}

/** สัดส่วนวันทับซ้อนของช่วงที่เลือกกับช่วงข้อมูลต้นทาง (0–1) */
export function peDateRangeOverlapFactor(
  dataFrom: string,
  dataTo: string,
  range: PeDateRange
): number {
  if (!range.from && !range.to) return 1
  const s0 = Date.parse(`${(dataFrom || '2000-01-01').slice(0, 10)}T12:00:00`)
  const s1 = Date.parse(`${(dataTo || '2100-12-31').slice(0, 10)}T12:00:00`)
  if (!Number.isFinite(s0) || !Number.isFinite(s1) || s1 < s0) return 1

  const a = Date.parse(`${(range.from || dataFrom).slice(0, 10)}T12:00:00`)
  const b = Date.parse(`${(range.to || dataTo).slice(0, 10)}T12:00:00`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1

  const start = Math.max(a, s0)
  const end = Math.min(b, s1)
  if (end < start) return 0

  const day = 86400000
  const seedDays = (s1 - s0) / day + 1
  const overlapDays = (end - start) / day + 1
  return Math.min(1, Math.max(0, overlapDays / seedDays))
}

export function peClampDisplayRange(
  dataFrom: string,
  dataTo: string,
  range: PeDateRange
): { dateFrom: string; dateTo: string } {
  if (!range.from && !range.to) return { dateFrom: dataFrom, dateTo: dataTo }
  const from = range.from || dataFrom
  const to = range.to || dataTo
  return {
    dateFrom: from > dataFrom ? from : dataFrom,
    dateTo: to < dataTo ? to : dataTo,
  }
}
