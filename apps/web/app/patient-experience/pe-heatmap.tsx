'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Eye, Search } from 'lucide-react'
import { cn } from '@/app/common/utils'
import {
  dissatColor,
  filterAndSortDepartments,
  PeDepartmentDetailDialog,
  rateColor,
  satColor,
  type PeDeptSortKey,
} from '@/app/patient-experience/pe-department-detail-dialog'
import { formatSatisfactionPercent } from '@/app/patient-experience/pe-survey-analytics'
import type { PeComment, PeDepartmentRow } from '@/app/patient-experience/pe-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const COLUMNS: Array<{ key: PeDeptSortKey; label: string }> = [
  { key: 'label', label: 'หน่วยงาน' },
  { key: 'count', label: 'n' },
  { key: 'avgSatisfaction', label: '% พึงพอใจ' },
  { key: 'returnRate', label: 'กลับมาใช้' },
  { key: 'recommendRate', label: 'บอกต่อ' },
  { key: 'dissatisfactionRate', label: 'ไม่พึงพอใจ' },
]

function HeatCell({
  label,
  color,
  title,
  muted = false,
}: {
  label: string
  color: string
  title?: string
  muted?: boolean
}) {
  return (
    <div
      title={title}
      className={cn(
        'rounded-md px-2 py-2 text-center text-[11px] font-bold shadow-sm',
        muted ? 'text-slate-400' : 'text-white'
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  )
}

export function PeHeatmap({
  rows,
  comments,
  selectedId,
  onSelectDepartment,
}: {
  rows: PeDepartmentRow[]
  comments: PeComment[]
  selectedId: string
  onSelectDepartment: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<PeDeptSortKey>('label')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [viewId, setViewId] = useState<string | null>(null)

  const filtered = useMemo(
    () => filterAndSortDepartments(rows, query, sortKey, sortDir),
    [rows, query, sortKey, sortDir]
  )

  const viewing = rows.find((r) => r.id === viewId) ?? null

  const toggleSort = (key: PeDeptSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'label' ? 'asc' : 'desc')
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-bold text-slate-900">
            Heatmap สรุปตัวชี้วัดตามหน่วยงาน
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            ค้นหา เรียงคอลัมน์ หรือคลิกแถวเพื่อดูรายละเอียด · {filtered.length.toLocaleString()} /{' '}
            {rows.length.toLocaleString()} หน่วยงาน
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-1.5 sm:items-end">
          {selectedId !== 'all' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 self-end text-xs text-slate-500"
              onClick={() => onSelectDepartment('all')}
            >
              แสดงทุกหน่วยงาน
            </Button>
          ) : null}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาหน่วยงาน..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-2 py-2 font-semibold">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <ArrowUpDown
                      className={cn(
                        'size-3',
                        sortKey === col.key ? 'text-[#6d28d9]' : 'text-slate-300'
                      )}
                    />
                  </button>
                </th>
              ))}
              <th className="px-2 py-2 font-semibold">ดู</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                  ไม่พบหน่วยงานที่ตรงกับการค้นหา
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr
                  key={d.id}
                  className={cn(
                    'cursor-pointer rounded-lg',
                    selectedId === d.id ? 'bg-violet-50' : 'hover:bg-slate-50'
                  )}
                  onClick={() => setViewId(d.id)}
                >
                  <td className="px-2 py-1 font-medium text-slate-800">{d.label}</td>
                  <td className="px-2 py-1 tabular-nums text-slate-600">
                    {d.count > 0 ? d.count.toLocaleString() : '—'}
                  </td>
                  <td className="px-1 py-1">
                    <HeatCell
                      label={d.count > 0 ? formatSatisfactionPercent(d.avgSatisfaction) : '—'}
                      color={d.count > 0 ? satColor(d.avgSatisfaction) : '#f1f5f9'}
                      muted={d.count <= 0}
                      title={
                        d.count > 0
                          ? `ความพึงพอใจ ${formatSatisfactionPercent(d.avgSatisfaction)}`
                          : 'ยังไม่มีผู้ตอบ'
                      }
                    />
                  </td>
                  <td className="px-1 py-1">
                    <HeatCell
                      label={d.count > 0 ? `${d.returnRate.toFixed(1)}%` : '—'}
                      color={d.count > 0 ? rateColor(d.returnRate) : '#f1f5f9'}
                      muted={d.count <= 0}
                      title={d.count > 0 ? `กลับมาใช้ ${d.returnRate.toFixed(1)}%` : 'ยังไม่มีผู้ตอบ'}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <HeatCell
                      label={d.count > 0 ? `${d.recommendRate.toFixed(1)}%` : '—'}
                      color={d.count > 0 ? rateColor(d.recommendRate) : '#f1f5f9'}
                      muted={d.count <= 0}
                      title={d.count > 0 ? `บอกต่อ ${d.recommendRate.toFixed(1)}%` : 'ยังไม่มีผู้ตอบ'}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <HeatCell
                      label={d.count > 0 ? `${d.dissatisfactionRate.toFixed(1)}%` : '—'}
                      color={d.count > 0 ? dissatColor(d.dissatisfactionRate) : '#f1f5f9'}
                      muted={d.count <= 0}
                      title={
                        d.count > 0
                          ? `ไม่พึงพอใจ ${d.dissatisfactionRate.toFixed(1)}%`
                          : 'ยังไม่มีผู้ตอบ'
                      }
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-[#6d28d9]"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewId(d.id)
                      }}
                    >
                      <Eye className="size-3.5" />
                      ดู
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PeDepartmentDetailDialog
        row={viewing}
        comments={comments}
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewId(null)}
        onFilterDashboard={onSelectDepartment}
      />
    </section>
  )
}
