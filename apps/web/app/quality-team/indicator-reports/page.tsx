'use client'

import { ExternalLink, BarChart3, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts'
import { useIndicatorsDashboard } from '@/hooks/use-indicators'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { StatCard } from '@/app/stat-card'
import { SectionHeader } from '@/app/section-header'
import { EmptyState } from '@/app/empty-state'
import { ChartCard } from '@/app/charts/chart-card'
import { ChartSkeleton, StatCardsSkeleton } from '@/app/loading-skeletons'
import { CHART_COLORS } from '@/app/charts/chart-theme'
import { KPI_PORTAL_URL } from '@/app/common/navigation'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

type IndicatorItem = {
  id: string
  code: string
  name: string
  unit: string | null
  targetValue: number | null
  status: 'pass' | 'fail' | 'warning' | 'unknown'
  latestValue: { value: number; period: string } | null
}

type DeptGroup = {
  department: { id: string; name: string; code: string } | null
  indicators: IndicatorItem[]
}

type DashboardData = {
  summary: { total: number; passing: number; failing: number; warning: number }
  byDepartment: DeptGroup[]
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  pass: { label: 'ผ่านเกณฑ์', className: 'chip-success' },
  warning: { label: 'เฝ้าระวัง', className: 'chip-warning' },
  fail: { label: 'ไม่ผ่าน', className: 'chip-danger' },
  unknown: {
    label: 'ยังไม่มีข้อมูล',
    className:
      'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
  },
}

export default function QualityTeamIndicatorReportsPage() {
  const { data, isLoading } = useIndicatorsDashboard() as {
    data: DashboardData | undefined
    isLoading: boolean
  }

  const summary = data?.summary
  const byDepartment = data?.byDepartment ?? []
  const total = summary?.total ?? 0

  const pieData = [
    { name: 'ผ่านเกณฑ์', value: summary?.passing ?? 0, color: CHART_COLORS.green },
    { name: 'เฝ้าระวัง', value: summary?.warning ?? 0, color: CHART_COLORS.gold },
    { name: 'ไม่ผ่าน', value: summary?.failing ?? 0, color: CHART_COLORS.rose },
  ].filter((d) => d.value > 0)

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="quality-team-indicators"
        title="รายงานตัวชี้วัดที่ติดตาม (ทีมนำ)"
        description="สรุปสถานะตัวชี้วัดคุณภาพสำหรับทีมนำ — ข้อมูลเชิงลึกดูได้ที่พอร์ทัล KPI"
      >
        <a
          href={KPI_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          เปิดพอร์ทัล KPI
          <ExternalLink className="size-4" />
        </a>
      </AdminEditablePageHeader>

      {isLoading ? (
        <>
          <StatCardsSkeleton />
          <ChartSkeleton />
        </>
      ) : total === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="ยังไม่มีข้อมูลตัวชี้วัดในระบบ"
          description="ระบบตัวชี้วัดหลักอยู่บนพอร์ทัล KPI — กดปุ่มด้านบนเพื่อเปิดดู หรือรอการบันทึกค่าตัวชี้วัด"
        />
      ) : (
        <>
          <section className={cn('flex flex-col gap-5')}>
            <SectionHeader label="สรุปภาพรวม" title="สถานะตัวชี้วัด" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="ตัวชี้วัดทั้งหมด" value={total} icon={BarChart3} variant="primary" />
              <StatCard label="ผ่านเกณฑ์" value={summary?.passing ?? 0} icon={CheckCircle2} variant="success" />
              <StatCard label="เฝ้าระวัง" value={summary?.warning ?? 0} icon={AlertTriangle} variant="warning" />
              <StatCard label="ไม่ผ่าน" value={summary?.failing ?? 0} icon={XCircle} variant="danger" />
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <ChartCard
              title="สัดส่วนสถานะ"
              description="กระจายตามผลการประเมินล่าสุด"
              icon={BarChart3}
              empty={pieData.length === 0}
            >
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartCard>

            <section className={cn(surfaceCardClass(), "overflow-hidden")}>
              <header className="border-b border-border/70 bg-muted/40 px-5 py-3">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  ตัวชี้วัดตามหน่วยงาน
                </h3>
              </header>
              <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                {byDepartment.map((group, gi) => (
                  <div key={group.department?.id ?? `none-${gi}`}>
                    <p className="sticky top-0 z-10 bg-white/95 px-5 py-2 text-xs font-semibold text-muted-foreground backdrop-blur">
                      {group.department?.name ?? 'ไม่ระบุหน่วยงาน'}
                    </p>
                    <ul className="divide-y divide-border/60">
                      {group.indicators.map((ind) => {
                        const meta = STATUS_META[ind.status] ?? STATUS_META.unknown
                        return (
                          <li key={ind.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{ind.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {ind.code}
                                {ind.latestValue
                                  ? ` · ล่าสุด ${ind.latestValue.value}${ind.unit ?? ''} (${ind.latestValue.period})`
                                  : ' · ยังไม่มีค่า'}
                              </p>
                            </div>
                            <span className={meta.className}>{meta.label}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
