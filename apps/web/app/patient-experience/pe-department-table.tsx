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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLUMNS: Array<{ key: PeDeptSortKey; label: string; align?: 'left' | 'right' | 'center' }> = [
  { key: 'label', label: 'หน่วยงาน', align: 'left' },
  { key: 'count', label: 'count', align: 'right' },
  { key: 'avgSatisfaction', label: '% พึงพอใจ', align: 'right' },
  { key: 'returnRate', label: '% กลับมาใช้', align: 'right' },
  { key: 'recommendRate', label: '% บอกต่อ', align: 'right' },
  { key: 'dissatisfactionRate', label: '% ไม่พึงพอใจ', align: 'right' },
]

type PeDepartmentTableProps = {
  rows: PeDepartmentRow[]
  comments: PeComment[]
  selectedId: string
  onSelectDepartment: (id: string) => void
}

export function PeDepartmentTable({
  rows,
  comments,
  selectedId,
  onSelectDepartment,
}: PeDepartmentTableProps) {
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-heading text-base font-bold text-slate-900">
            สรุปจำนวนการประเมินตามหน่วยงาน
          </h3>
          <p className="mt-1 text-sm text-slate-500">
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

      <div className="max-h-[28rem] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
            <TableRow className="hover:bg-slate-50/95">
              <TableHead className="w-12 text-center font-semibold text-slate-600">#</TableHead>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'font-semibold text-slate-600',
                    col.align === 'right' && 'text-right',
                    col.key === 'label' && 'min-w-[14rem]'
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1 hover:text-slate-900',
                      col.align === 'right' && 'ml-auto'
                    )}
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
                </TableHead>
              ))}
              <TableHead className="w-20 text-center font-semibold text-slate-600">ดู</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-slate-400">
                  ไม่พบหน่วยงานที่ตรงกับการค้นหา
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    'cursor-pointer',
                    selectedId === row.id ? 'bg-violet-50' : 'hover:bg-violet-50/40'
                  )}
                  onClick={() => setViewId(row.id)}
                >
                  <TableCell className="text-center text-slate-400">{index + 1}</TableCell>
                  <TableCell className="font-medium text-slate-800">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                    {row.count > 0 ? row.count.toLocaleString('th-TH') : '—'}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums font-medium"
                    style={{ color: row.count > 0 ? satColor(row.avgSatisfaction) : undefined }}
                  >
                    {row.count > 0 ? formatSatisfactionPercent(row.avgSatisfaction) : '—'}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    style={{ color: row.count > 0 ? rateColor(row.returnRate) : undefined }}
                  >
                    {row.count > 0 ? `${row.returnRate.toFixed(1)}%` : '—'}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    style={{ color: row.count > 0 ? rateColor(row.recommendRate) : undefined }}
                  >
                    {row.count > 0 ? `${row.recommendRate.toFixed(1)}%` : '—'}
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums font-medium"
                    style={{
                      color: row.count > 0 ? dissatColor(row.dissatisfactionRate) : undefined,
                    }}
                  >
                    {row.count > 0 ? `${row.dissatisfactionRate.toFixed(1)}%` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-[#6d28d9]"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewId(row.id)
                      }}
                    >
                      <Eye className="size-3.5" />
                      ดู
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
