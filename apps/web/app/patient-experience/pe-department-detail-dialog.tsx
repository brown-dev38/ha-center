'use client'

import { X } from 'lucide-react'
import { cn } from '@/app/common/utils'
import {
  PE_SURVEY_DEPARTMENTS,
  resolveSurveyDepartmentLabel,
} from '@/app/patient-experience/pe-survey-form-content'
import { formatSatisfactionPercent } from '@/app/patient-experience/pe-survey-analytics'
import type { PeComment, PeDepartmentRow } from '@/app/patient-experience/pe-types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type PeDeptSortKey =
  | 'label'
  | 'count'
  | 'avgSatisfaction'
  | 'returnRate'
  | 'recommendRate'
  | 'dissatisfactionRate'

export function satColor(score: number): string {
  if (score >= 4.7) return '#16a34a'
  if (score >= 4.4) return '#eab308'
  if (score >= 4.0) return '#ea580c'
  return '#dc2626'
}

export function rateColor(pct: number): string {
  if (pct >= 98) return '#16a34a'
  if (pct >= 95) return '#eab308'
  if (pct >= 90) return '#ea580c'
  return '#dc2626'
}

export function dissatColor(pct: number): string {
  if (pct <= 4) return '#16a34a'
  if (pct <= 6) return '#eab308'
  if (pct <= 8) return '#ea580c'
  return '#dc2626'
}

export function healthLabel(avg: number): string {
  if (avg >= 4.7) return 'ดีมาก'
  if (avg >= 4.4) return 'ปานกลาง'
  if (avg >= 4.0) return 'พอใช้'
  return 'ต้องพัฒนา'
}

export function filterAndSortDepartments(
  rows: PeDepartmentRow[],
  query: string,
  sortKey: PeDeptSortKey,
  sortDir: 'asc' | 'desc'
): PeDepartmentRow[] {
  const q = query.trim().toLowerCase()
  const list = q ? rows.filter((r) => r.label.toLowerCase().includes(q)) : [...rows]

  list.sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === 'string' && typeof bv === 'string') {
      const order = (label: string) => {
        const index = PE_SURVEY_DEPARTMENTS.findIndex((dept) => dept.label === label)
        return index < 0 ? PE_SURVEY_DEPARTMENTS.length : index
      }
      const diff = order(av) - order(bv)
      if (diff !== 0) return sortDir === 'asc' ? diff : -diff
      return sortDir === 'asc' ? av.localeCompare(bv, 'th') : bv.localeCompare(av, 'th')
    }
    const an = Number(av)
    const bn = Number(bv)
    return sortDir === 'asc' ? an - bn : bn - an
  })
  return list
}

export function PeDepartmentDetailDialog({
  row,
  comments,
  open,
  onOpenChange,
  onFilterDashboard,
}: {
  row: PeDepartmentRow | null
  comments: PeComment[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilterDashboard: (id: string) => void
}) {
  const deptComments = row
    ? comments.filter(
        (c) => c.department === row.label || resolveSurveyDepartmentLabel(c.department) === row.label
      )
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {row ? (
          <>
            <DialogHeader>
              <DialogTitle>{row.label}</DialogTitle>
              <DialogDescription>
                รายละเอียดตัวชี้วัด Patient Experience · {healthLabel(row.avgSatisfaction)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
              <KpiTile label="จำนวนผู้ตอบ" value={row.count.toLocaleString()} />
              <KpiTile
                label="คะแนนพึงพอใจ"
                value={formatSatisfactionPercent(row.avgSatisfaction)}
                color={satColor(row.avgSatisfaction)}
              />
              <KpiTile
                label="% กลับมาใช้"
                value={`${row.returnRate.toFixed(1)}%`}
                color={rateColor(row.returnRate)}
              />
              <KpiTile
                label="% บอกต่อ"
                value={`${row.recommendRate.toFixed(1)}%`}
                color={rateColor(row.recommendRate)}
              />
              <KpiTile
                label="% ไม่พึงพอใจ"
                value={`${row.dissatisfactionRate.toFixed(1)}%`}
                color={dissatColor(row.dissatisfactionRate)}
                className="col-span-2"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">
                ความคิดเห็น ({deptComments.length})
              </p>
              <div className="max-h-40 overflow-auto rounded-lg border border-slate-100 bg-slate-50/80">
                {deptComments.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">
                    ไม่มีข้อความในหน่วยงานนี้
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {deptComments.slice(0, 20).map((c) => (
                      <li key={c.id} className="px-3 py-2 text-sm text-slate-700">
                        {c.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="gap-1 text-slate-500"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-3.5" />
                ปิด
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onFilterDashboard(row.id)
                  onOpenChange(false)
                }}
              >
                กรองแดชบอร์ดตามหน่วยงานนี้
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function KpiTile({
  label,
  value,
  color,
  className,
}: {
  label: string
  value: string
  color?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5', className)}>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className="mt-1 text-lg font-bold tabular-nums text-slate-900"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  )
}
