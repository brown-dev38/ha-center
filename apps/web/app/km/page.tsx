'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Cpu, Lightbulb, Search, Sparkles, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { ChartCard } from '@/app/charts/chart-card'
import { CHART_COLORS, CHART_GRID_COLOR, chartAxisTick } from '@/app/charts/chart-theme'
import { KmOverviewPanel } from '@/app/km/km-overview-panel'
import { KmSessionCard } from '@/app/km/km-session-card'
import { KmSessionCreateDialog } from '@/app/km/km-session-create-dialog'
import { KmResultCard } from '@/app/km/km-result-card'
import { KmInnovationCard } from '@/app/km/km-innovation-card'
import { useKmSessions, useKmResults, useKmInnovations } from '@/hooks/use-km'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

type KmTab = 'overview' | 'sessions' | 'systems' | 'innovations'

const TABS: { id: KmTab; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'ภาพรวม', icon: Lightbulb },
  { id: 'sessions', label: 'รายงานการประชุม', icon: Users },
  { id: 'systems', label: 'ระบบที่พัฒนา', icon: Cpu },
  { id: 'innovations', label: 'นวัตกรรม', icon: Sparkles },
]

export default function KmPage() {
  const [tab, setTab] = useState<KmTab>('overview')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<number | ''>('')

  const yearFilter = year === '' ? undefined : Number(year)
  const { data: sessionsRes, isLoading: sessionsLoading } = useKmSessions({
    search: search.trim() || undefined,
    year: yearFilter,
    limit: 50,
  })
  const { data: systems, isLoading: systemsLoading } = useKmResults({
    type: 'system',
    year: yearFilter,
  })
  const { data: innovations, isLoading: innovationsLoading } = useKmInnovations({
    year: yearFilter,
  })

  const sessions = Array.isArray(sessionsRes?.data) ? sessionsRes.data : []
  const stats = useMemo(
    () => ({
      sessions: sessionsRes?.pagination?.total ?? sessions.length,
      systems: systems?.length ?? 0,
      innovations: innovations?.length ?? 0,
    }),
    [sessionsRes, sessions.length, systems, innovations]
  )

  const sessionsByYear = useMemo(() => {
    const map = new Map<number, number>()
    for (const s of sessions) {
      if (s.fiscalYear == null) continue
      map.set(s.fiscalYear, (map.get(s.fiscalYear) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([fy, count]) => ({ name: `ปี ${fy}`, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [sessions])

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="km"
        title="KM การจัดการความรู้"
        description="บันทึกรายงานการประชุม ผลลัพธ์ ระบบที่พัฒนา และนวัตกรรม — ศูนย์ประสานงาน HA"
      >
        <KmSessionCreateDialog />
      </AdminEditablePageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'KM Sessions', value: stats.sessions, accent: 'text-primary' },
          { label: 'ระบบที่พัฒนา', value: stats.systems, accent: 'text-sky-600' },
          { label: 'นวัตกรรม', value: stats.innovations, accent: 'text-teal-700' },
        ].map((s) => (
          <div key={s.label} className={cn(surfaceCardClass(), "px-4 py-3")}>
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', s.accent)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={tab === t.id ? 'default' : 'ghost'}
                className="gap-1.5"
                onClick={() => setTab(t.id)}
              >
                <Icon className="size-3.5" />
                {t.label}
              </Button>
            )
          })}
        </div>
        {tab !== 'overview' && (
          <div className="flex gap-2">
            {tab === 'sessions' && (
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาหัวข้อ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            <select
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              className="h-9 rounded-lg border border-input px-2.5 text-sm"
            >
              <option value="">ทุกปี</option>
              {[0, 1, 2].map((offset) => {
                const y = new Date().getFullYear() + 543 - offset
                return (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      {tab === 'overview' && (
        <>
          <ChartCard
            title="รายงาน KM ตามปีงบประมาณ"
            description="จำนวน KM Session ที่บันทึกในแต่ละปี"
            icon={BarChart3}
            height={240}
            empty={sessionsByYear.length === 0}
          >
            <BarChart data={sessionsByYear} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
              <XAxis dataKey="name" tick={chartAxisTick} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={chartAxisTick} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" name="Session" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
          <KmOverviewPanel />
        </>
      )}

      {tab === 'sessions' && (
        <>
          {sessionsLoading && (
            <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
          )}
          {!sessionsLoading && sessions.length === 0 && (
            <EmptyState
              icon={Users}
              title="ยังไม่มีรายงาน KM"
              description="บันทึกครั้งแรกหลังการประชุม หรือรัน db:seed"
            >
              <KmSessionCreateDialog />
            </EmptyState>
          )}
          <div className="grid gap-4">
            {sessions.map((s) => (
              <KmSessionCard key={s.id} session={s} />
            ))}
          </div>
        </>
      )}

      {tab === 'systems' && (
        <>
          {systemsLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
          {!systemsLoading && (systems?.length ?? 0) === 0 && (
            <EmptyState icon={Cpu} title="ยังไม่มีระบบที่บันทึก" description="เพิ่มผลลัพธ์ประเภท system ใน KM Session" />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(systems ?? []).map((item) => (
              <KmResultCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {tab === 'innovations' && (
        <>
          {innovationsLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
          {!innovationsLoading && (innovations?.length ?? 0) === 0 && (
            <EmptyState icon={Sparkles} title="ยังไม่มีนวัตกรรม" description="บันทึกนวัตกรรมจากหน้ารายละเอียด KM Session" />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(innovations ?? []).map((item) => (
              <KmInnovationCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
