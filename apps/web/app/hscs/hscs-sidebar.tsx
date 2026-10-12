'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/app/common/utils'
import { HSCS_AVAILABLE_YEARS, HSCS_VIEW_OPTIONS } from '@/app/hscs/hscs-config'
import { HSCS_BAND_STYLES, HSCS_LEGEND } from '@/app/hscs/hscs-scoring'
import type { HscsViewId } from '@/app/hscs/hscs-types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type HscsSidebarProps = {
  year: number
  viewId: HscsViewId
  onYearChange: (year: number) => void
  onViewChange: (viewId: HscsViewId) => void
  onReload: () => void
  reloading?: boolean
}

export function HscsSidebar({
  year,
  viewId,
  onYearChange,
  onViewChange,
  onReload,
  reloading,
}: HscsSidebarProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-slate-200 bg-white lg:w-[17.5rem]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
          UPH Hospital
        </p>
        <h2 className="font-heading text-lg font-bold text-white">UPH-HSCS</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-violet-100/90">
          Hospital Survey on Culture of Safety
        </p>
      </div>

      <div className="space-y-4 border-b border-slate-200 p-4">
        <div className="space-y-2">
          <Label htmlFor="hscs-year" className="text-xs font-semibold text-slate-600">
            เลือกปีข้อมูล HSCS
          </Label>
          <select
            id="hscs-year"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
          >
            {HSCS_AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={onReload}
          disabled={reloading}
        >
          <RefreshCw className={cn('size-3.5', reloading && 'animate-spin')} />
          Clear cache / reload data
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          เลือกหน้าที่ต้องการดู
        </p>
        <nav className="space-y-1">
          {HSCS_VIEW_OPTIONS.map((option) => {
            const active = viewId === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onViewChange(option.id)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] leading-snug transition',
                  active
                    ? 'bg-violet-50 font-semibold text-[#6d28d9] shadow-[inset_0_0_0_1px_rgba(109,40,217,0.18)]'
                    : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span
                  className={cn(
                    'mt-1 size-2 shrink-0 rounded-full',
                    active ? 'bg-[#6d28d9]' : 'bg-slate-300'
                  )}
                  aria-hidden
                />
                <span>{option.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          เกณฑ์สีที่ใช้ร่วมกัน
        </p>
        <ul className="space-y-2">
          {HSCS_LEGEND.map((item) => {
            const styles = HSCS_BAND_STYLES[item.band]
            return (
              <li key={item.band} className="flex items-start gap-2.5 text-[11px] leading-snug">
                <span
                  className={cn('mt-0.5 size-3 shrink-0 rounded-sm', styles.bg, styles.border, 'border')}
                  aria-hidden
                />
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-800">{item.range}</span>
                  {' — '}
                  {item.description}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
