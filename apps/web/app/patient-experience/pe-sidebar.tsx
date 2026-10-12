'use client'

import { Leaf } from 'lucide-react'
import { cn } from '@/app/common/utils'
import { PE_DEPARTMENTS } from '@/app/patient-experience/pe-config'
import {
  formatThaiDateRangeLabel,
  PeDateRangeFilter,
  type PeDateRange,
} from '@/app/patient-experience/pe-date-range'
import type { PeDepartmentId } from '@/app/patient-experience/pe-types'
import { Label } from '@/components/ui/label'

type PeSidebarProps = {
  departmentId: PeDepartmentId
  dateRange: PeDateRange
  dateFrom: string
  dateTo: string
  realtime: boolean
  onDepartmentChange: (id: PeDepartmentId) => void
  onDateRangeChange: (range: PeDateRange) => void
}

export function PeSidebar({
  departmentId,
  dateRange,
  dateFrom,
  dateTo,
  realtime,
  onDepartmentChange,
  onDateRangeChange,
}: PeSidebarProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-slate-200 bg-[#f8fafc] lg:w-[17.5rem]">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-[#6d28d9] text-white shadow-sm">
            <Leaf className="size-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold leading-snug text-slate-900">
              Patient Experience{' '}
              <span className="text-[#2563eb]">[PEP]</span>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {formatThaiDateRangeLabel(dateFrom, dateTo)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              <span
                className={cn(
                  'size-2 rounded-full',
                  realtime ? 'bg-emerald-500' : 'bg-slate-300'
                )}
                aria-hidden
              />
              แบบประเมินรับฟังความคิดเห็นผู้ป่วย
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            ตัวกรองข้อมูล (Filter)
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pe-department" className="text-xs font-semibold text-slate-600">
                เลือกหน่วยงาน:
              </Label>
              <select
                id="pe-department"
                value={departmentId}
                onChange={(e) => onDepartmentChange(e.target.value as PeDepartmentId)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
              >
                {PE_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <PeDateRangeFilter value={dateRange} onChange={onDateRangeChange} />
          </div>
        </div>
      </div>
    </aside>
  )
}
