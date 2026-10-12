'use client'

import { Building2, Star, Trophy } from 'lucide-react'
import { cn } from '@/app/common/utils'
import { cqiDeptProgress, type CqiDeptSummary } from '@/app/cqi/cqi'

export function CqiDepartmentCard({
  summary,
  selected,
  onSelect,
}: {
  summary: CqiDeptSummary
  selected: boolean
  onSelect: () => void
}) {
  const pct = cqiDeptProgress(summary.completed, summary.total)
  const dept = summary.department

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all duration-300',
        selected
          ? 'border-primary/40 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
          : 'border-border/80 hover:border-primary/25 hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          selected && 'opacity-100',
          'bg-gradient-to-br from-primary/[0.04] via-transparent to-ha-green/[0.06]'
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/12 to-ha-green/10 text-primary">
            <Building2 className="size-6" />
          </div>
          {summary.outstanding > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-100/80 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              <Trophy className="size-3" />
              {summary.outstanding} โดดเด่น
            </span>
          )}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {dept.code}
        </p>
        <h3 className="mt-0.5 text-base font-bold leading-snug text-foreground group-hover:text-primary">
          {dept.name}
        </h3>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tabular-nums text-primary">{summary.total}</p>
            <p className="text-xs text-muted-foreground">โครงการ CQI</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-700">{summary.completed}</span> เสร็จแล้ว
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-ha-green transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {summary.outstanding > 0 && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-800">
            <Star className="size-3 fill-amber-400 text-amber-500" />
            มีผลงานระดับรางวัล
          </p>
        )}
      </div>
    </button>
  )
}
