'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { HaLogo } from '@/app/brand/ha-logo'
import { HSCS_SCOPE_OPTIONS, HSCS_VIEW_OPTIONS } from '@/app/hscs/hscs-config'
import { getHscsDataset } from '@/app/hscs/hscs-data'
import { HscsDimensionGrid } from '@/app/hscs/hscs-dimension-grid'
import { HscsDimensionTrends } from '@/app/hscs/hscs-dimension-trends'
import { HscsKpiCards } from '@/app/hscs/hscs-kpi-cards'
import { HscsSidebar } from '@/app/hscs/hscs-sidebar'
import { getHscsTrendDataset } from '@/app/hscs/hscs-trend-data'
import type { HscsDashboardScopeId, HscsViewId } from '@/app/hscs/hscs-types'
import { Label } from '@/components/ui/label'

export function HscsPageContent() {
  const [year, setYear] = useState(2569)
  const [viewId, setViewId] = useState<HscsViewId>('overview')
  const [scopeId, setScopeId] = useState<HscsDashboardScopeId>('organization')
  const [cacheNonce, setCacheNonce] = useState(0)
  const [reloading, startReload] = useTransition()

  const viewLabel = HSCS_VIEW_OPTIONS.find((v) => v.id === viewId)?.label ?? viewId
  const scopeLabel = HSCS_SCOPE_OPTIONS.find((s) => s.id === scopeId)?.label ?? scopeId

  const trendDataset = useMemo(
    () => getHscsTrendDataset(scopeId, year, scopeLabel),
    [scopeId, year, scopeLabel]
  )

  const dataset = useMemo(
    () => getHscsDataset(year, viewId, scopeId),
    [year, viewId, scopeId, cacheNonce]
  )

  const handleReload = useCallback(() => {
    startReload(() => {
      setCacheNonce((n) => n + 1)
    })
  }, [])

  if (!dataset) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        ไม่พบข้อมูล HSCS สำหรับปีที่เลือก
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.22)]">
      <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col lg:flex-row">
        <HscsSidebar
          year={year}
          viewId={viewId}
          onYearChange={setYear}
          onViewChange={setViewId}
          onReload={handleReload}
          reloading={reloading}
        />

        <div className="min-w-0 flex-1 bg-[#f8fafc]">
          {/* Top bar */}
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <span className="hidden h-6 w-1 rounded-full bg-[#6d28d9] sm:block" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-slate-500">ปี {year}</p>
                <p className="font-heading text-sm font-bold text-slate-900">UPH-HSCS Dashboard</p>
              </div>
            </div>
            <HaLogo size="sm" className="shrink-0 opacity-90" />
          </header>

          <div className="space-y-5 p-4 lg:p-6">
            {/* Scope selector */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <Label htmlFor="hscs-scope" className="text-xs font-semibold text-slate-600">
                  คลิกเลือกรูปแบบ Dashboard
                </Label>
              </div>
              <div className="p-4">
                <select
                  id="hscs-scope"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value as HscsDashboardScopeId)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
                >
                  {HSCS_SCOPE_OPTIONS.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.label}
                    </option>
                  ))}
                </select>
                <p className="mt-3 text-sm text-slate-600">
                  กำลังแสดงผล:{' '}
                  <span className="font-semibold text-[#6d28d9]">{scopeLabel}</span>
                  {' | '}
                  <span className="font-semibold text-slate-800">ปี {year}</span>
                  {' | '}
                  <span className="font-medium text-slate-700">{viewLabel}</span>
                </p>
              </div>
            </div>

            {reloading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin text-[#6d28d9]" />
                กำลังโหลดข้อมูลใหม่...
              </div>
            ) : (
              <>
                <HscsKpiCards summary={dataset.summary} />

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                  <HscsDimensionGrid
                    dimensions={dataset.dimensions}
                    title={
                      viewId === 'overview'
                        ? 'ร้อยละคำตอบเชิงบวก (% Positive Response) จำแนกตามมิติ'
                        : `Color-coded Matrix — ${HSCS_VIEW_OPTIONS.find((v) => v.id === viewId)?.shortLabel}`
                    }
                  />
                </div>

                <HscsDimensionTrends dataset={trendDataset} />

                <p className="text-center text-[11px] text-slate-400">
                  อัปเดตล่าสุด{' '}
                  {new Date(dataset.updatedAt).toLocaleString('th-TH', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {' · '}
                  ข้อมูลตัวอย่างสำหรับสาธิตระบบ
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
