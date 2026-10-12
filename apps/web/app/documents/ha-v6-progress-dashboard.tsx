'use client'

import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  LayoutDashboard,
  Layers,
  PieChart as PieIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/app/charts/chart-card'
import { CHART_COLORS, CHART_GRID_COLOR, chartAxisTick } from '@/app/charts/chart-theme'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import {
  HA_V6_DASHBOARD_META,
  HA_V6_KEY_CHANGES,
  percentCompleted,
  sumHaV6Progress,
  toChartRows,
  type HaV6ProgressRow,
} from '@/app/documents/ha-v6-dashboard-data'
import { useHaV6ProgressRows } from '@/app/documents/use-ha-v6-tracker'
import { useUILabel } from '@/hooks/use-app-config'

type StatusKey = 'notStarted' | 'inProgress' | 'review' | 'completed'

const STATUS_COLORS: Record<StatusKey, string> = {
  notStarted: '#94a3b8',
  inProgress: CHART_COLORS.sky,
  review: CHART_COLORS.gold,
  completed: CHART_COLORS.green,
}

const STATUS_ICON: Record<StatusKey, LucideIcon> = {
  notStarted: CircleDashed,
  inProgress: Activity,
  review: ClipboardCheck,
  completed: CheckCircle2,
}

function share(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 1000) / 10
}

function clampPct(percent: number): number {
  return Math.min(100, Math.max(0, percent))
}

/** วงแหวนแสดงความคืบหน้ารวม พร้อมตัวเลขกลางวง */
function OverallGauge({ percent }: { percent: number }) {
  const value = clampPct(percent)
  const data = [{ name: 'completed', value }]

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={16}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <defs>
            <linearGradient id="haV6GaugeFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.green} />
              <stop offset="100%" stopColor={CHART_COLORS.primary} />
            </linearGradient>
          </defs>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'rgba(148,163,184,0.18)' }}
            dataKey="value"
            cornerRadius={16}
            fill="url(#haV6GaugeFill)"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-4xl font-bold tabular-nums text-foreground">
          {value.toFixed(1)}
          <span className="text-xl text-muted-foreground">%</span>
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          เสร็จสมบูรณ์
        </span>
      </div>
    </div>
  )
}

type TooltipEntry = { name: string; value: number; color?: string; payload?: Record<string, unknown> }

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)

  return (
    <div className="rounded-xl border border-border/70 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      {label && <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">{entry.value}</span>
          </div>
        ))}
        {total > 0 && payload.length > 1 && (
          <div className="mt-1 flex items-center gap-2 border-t border-border/60 pt-1 text-xs">
            <span className="ml-auto text-muted-foreground">รวม</span>
            <span className="font-semibold tabular-nums text-foreground">{total}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/** แถบสัดส่วนสถานะแบบ stacked ต่อแถว */
function StatusDistributionBar({ row }: { row: HaV6ProgressRow }) {
  const segments: { key: StatusKey; value: number }[] = [
    { key: 'completed', value: row.completed },
    { key: 'review', value: row.review },
    { key: 'inProgress', value: row.inProgress },
    { key: 'notStarted', value: row.notStarted },
  ]
  const total = row.total || 1

  return (
    <div className="flex h-2.5 w-full min-w-[7rem] overflow-hidden rounded-full bg-slate-200/70">
      {segments.map((seg) =>
        seg.value > 0 ? (
          <div
            key={seg.key}
            className="h-full transition-all duration-500"
            style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: STATUS_COLORS[seg.key] }}
            title={`${seg.value}`}
          />
        ) : null
      )}
    </div>
  )
}

function StatusTile({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: LucideIcon
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = share(value, total)
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {pct.toFixed(1)}%
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampPct(pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex min-w-[7rem] items-center gap-2">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
          style={{ width: `${clampPct(percent)}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground/80">
        {percent.toFixed(1)}%
      </span>
    </div>
  )
}

function ProgressTable({ rows, totalRow }: { rows: HaV6ProgressRow[]; totalRow: HaV6ProgressRow }) {
  const colSection = useUILabel('haV6.dashboard.col.section', 'หมวด / ตอน')
  const colTotal = useUILabel('haV6.dashboard.col.total', 'ทั้งหมด')
  const colNotStarted = useUILabel('haV6.dashboard.col.notStarted', 'ยังไม่เริ่ม')
  const colInProgress = useUILabel('haV6.dashboard.col.inProgress', 'กำลังจัดทำ')
  const colReview = useUILabel('haV6.dashboard.col.review', 'ทบทวน')
  const colCompleted = useUILabel('haV6.dashboard.col.completed', 'เสร็จ')
  const colPercent = useUILabel('haV6.dashboard.col.percent', 'ความคืบหน้า')

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-gradient-to-r from-primary/[0.07] via-secondary/[0.05] to-transparent text-left">
            <th className="px-4 py-3.5 font-semibold text-foreground/90">{colSection}</th>
            <th className="px-3 py-3.5 text-center font-semibold text-foreground/90">{colTotal}</th>
            <th className="px-3 py-3.5 text-center font-semibold text-slate-600">{colNotStarted}</th>
            <th className="px-3 py-3.5 text-center font-semibold text-sky-700">{colInProgress}</th>
            <th className="px-3 py-3.5 text-center font-semibold text-amber-700">{colReview}</th>
            <th className="px-3 py-3.5 text-center font-semibold text-emerald-700">{colCompleted}</th>
            <th className="px-4 py-3.5 font-semibold text-foreground/90">{colPercent}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = percentCompleted(row)
            return (
              <tr
                key={row.id}
                className="border-b border-border/50 bg-white transition-colors hover:bg-primary/[0.03]"
              >
                <td className="px-4 py-3 font-medium text-foreground/90">{row.section}</td>
                <td className="px-3 py-3 text-center font-semibold tabular-nums">{row.total}</td>
                <td className="px-3 py-3 text-center tabular-nums text-slate-500">{row.notStarted}</td>
                <td className="px-3 py-3 text-center tabular-nums text-sky-700">{row.inProgress}</td>
                <td className="px-3 py-3 text-center tabular-nums text-amber-700">{row.review}</td>
                <td className="px-3 py-3 text-center tabular-nums text-emerald-700">{row.completed}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <ProgressBar percent={pct} />
                    <StatusDistributionBar row={row} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-primary/20 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 font-semibold">
            <td className="px-4 py-3.5 text-foreground">{totalRow.section}</td>
            <td className="px-3 py-3.5 text-center tabular-nums">{totalRow.total}</td>
            <td className="px-3 py-3.5 text-center tabular-nums text-slate-600">{totalRow.notStarted}</td>
            <td className="px-3 py-3.5 text-center tabular-nums text-sky-800">{totalRow.inProgress}</td>
            <td className="px-3 py-3.5 text-center tabular-nums text-amber-800">{totalRow.review}</td>
            <td className="px-3 py-3.5 text-center tabular-nums text-emerald-800">{totalRow.completed}</td>
            <td className="px-4 py-3.5">
              <ProgressBar percent={percentCompleted(totalRow)} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function HaV6ProgressDashboard() {
  const rows = useHaV6ProgressRows()
  const totalRow = sumHaV6Progress(rows)
  const eyebrow = useUILabel('haV6.eyebrow', 'เอกสารมาตรฐาน HA ฉบับที่ 6')
  const statNotStarted = useUILabel('haV6.dashboard.stat.notStarted', 'ยังไม่เริ่ม')
  const statInProgress = useUILabel('haV6.dashboard.stat.inProgress', 'กำลังจัดทำ')
  const statReview = useUILabel('haV6.dashboard.stat.review', 'ทบทวน')
  const statCompleted = useUILabel('haV6.dashboard.stat.completed', 'เสร็จสมบูรณ์')
  const chartNotStarted = useUILabel('haV6.dashboard.col.notStarted', 'ยังไม่เริ่ม')
  const chartInProgress = useUILabel('haV6.dashboard.col.inProgress', 'กำลังจัดทำ')
  const chartReview = useUILabel('haV6.dashboard.col.review', 'ทบทวน')
  const chartCompleted = useUILabel('haV6.dashboard.col.completed', 'เสร็จ')
  const chartLabels = {
    notStarted: chartNotStarted,
    inProgress: chartInProgress,
    review: chartReview,
    completed: chartCompleted,
  }
  const chartRows = toChartRows(rows, chartLabels)
  const overallPercent = percentCompleted(totalRow)
  const activePercent = share(totalRow.inProgress + totalRow.review, totalRow.total)

  const statusTiles: { key: StatusKey; label: string; value: number }[] = [
    { key: 'completed', label: statCompleted, value: totalRow.completed },
    { key: 'review', label: statReview, value: totalRow.review },
    { key: 'inProgress', label: statInProgress, value: totalRow.inProgress },
    { key: 'notStarted', label: statNotStarted, value: totalRow.notStarted },
  ]

  const statusPie = [
    { name: chartNotStarted, value: totalRow.notStarted, color: STATUS_COLORS.notStarted },
    { name: chartInProgress, value: totalRow.inProgress, color: STATUS_COLORS.inProgress },
    { name: chartReview, value: totalRow.review, color: STATUS_COLORS.review },
    { name: chartCompleted, value: totalRow.completed, color: STATUS_COLORS.completed },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <AdminEditablePageHeader
        pageKey="ha-v6-dashboard"
        title={HA_V6_DASHBOARD_META.title}
        description={HA_V6_DASHBOARD_META.subtitle}
        icon={LayoutDashboard}
        eyebrow={eyebrow}
      />

      {/* ── ภาพรวมความคืบหน้า ── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <SurfaceCard className="relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-primary/10 to-secondary/5 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-semibold text-foreground">ความคืบหน้ารวม</h3>
              <p className="text-[11px] text-muted-foreground">ทุกหมวดของแฟ้มเอกสาร</p>
            </div>
          </div>
          <div className="relative mt-2">
            <OverallGauge percent={overallPercent} />
          </div>
          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
              <p className="font-heading text-lg font-bold tabular-nums text-foreground">
                {totalRow.completed}
                <span className="text-sm font-medium text-muted-foreground">/{totalRow.total}</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                ฉบับที่เสร็จแล้ว
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
              <p className="font-heading text-lg font-bold tabular-nums text-foreground">
                {activePercent.toFixed(1)}
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                กำลังดำเนินการ
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="flex flex-col p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary">
              <Layers className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                สรุปสถานะเอกสาร {totalRow.total} ฉบับ
              </h3>
              <p className="text-[11px] text-muted-foreground">แยกตามสถานะการจัดทำทั้งโครงการ</p>
            </div>
            <span className="hidden items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline-flex">
              <Sparkles className="size-3" />
              HA v6
            </span>
          </div>
          <div className="mt-4 grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
            {statusTiles.map((tile) => (
              <StatusTile
                key={tile.key}
                icon={STATUS_ICON[tile.key]}
                label={tile.label}
                value={tile.value}
                total={totalRow.total}
                color={STATUS_COLORS[tile.key]}
              />
            ))}
          </div>
        </SurfaceCard>
      </div>

      {/* ── กราฟ ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="ความคืบหน้าตามหมวด / ตอน"
          description="จำนวนเอกสารแยกตามสถานะในแต่ละหมวด"
          icon={BarChart3}
          height={320}
        >
          <BarChart data={chartRows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
            <XAxis dataKey="name" tick={chartAxisTick} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={chartAxisTick} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(15,76,129,0.05)' }} content={<ChartTooltip />} />
            <Bar dataKey={chartNotStarted} stackId="status" fill={STATUS_COLORS.notStarted} />
            <Bar dataKey={chartInProgress} stackId="status" fill={STATUS_COLORS.inProgress} />
            <Bar dataKey={chartReview} stackId="status" fill={STATUS_COLORS.review} />
            <Bar dataKey={chartCompleted} stackId="status" fill={STATUS_COLORS.completed} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="สัดส่วนสถานะรวมทั้งโครงการ"
          description={`เอกสารทั้งหมด ${totalRow.total} ฉบับ`}
          icon={PieIcon}
          height={320}
          empty={statusPie.length === 0}
        >
          <PieChart>
            <Pie
              data={statusPie}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={statusPie.length > 1 ? 3 : 0}
              stroke="#fff"
              strokeWidth={2}
            >
              {statusPie.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ChartCard>
      </div>

      {/* legend สถานะ (ใช้ร่วมทั้งสองกราฟ) */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        {statusTiles.map((tile) => (
          <span key={tile.key} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[tile.key] }}
              aria-hidden
            />
            {tile.label}
            <span className="tabular-nums text-foreground/70">({tile.value})</span>
          </span>
        ))}
      </div>

      {/* ── ตารางความคืบหน้า ── */}
      <SurfaceCard className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary">
            <LayoutDashboard className="size-4" />
          </span>
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              ตารางความคืบหน้าแฟ้มเอกสาร
            </h3>
            <p className="text-sm text-muted-foreground">สรุปจำนวนเอกสารแยกตามหมวดและสถานะการจัดทำ</p>
          </div>
        </div>
        <ProgressTable rows={rows} totalRow={totalRow} />
      </SurfaceCard>

      {/* ── จุดเปลี่ยนสำคัญ ── */}
      <SurfaceCard className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700">
            <Sparkles className="size-4" />
          </span>
          <h3 className="font-heading text-base font-semibold text-foreground">
            จุดเปลี่ยนสำคัญของ HA ฉบับที่ 6 (เทียบ ฉบับที่ 5)
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {HA_V6_KEY_CHANGES.map((item, index) => (
            <div
              key={item}
              className={cn(
                'flex gap-3 rounded-xl border border-border/60 bg-white p-3.5 transition-colors hover:border-primary/30'
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold tabular-nums text-primary">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
