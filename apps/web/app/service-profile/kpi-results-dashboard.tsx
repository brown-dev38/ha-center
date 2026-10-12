'use client'

import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Award, CheckCircle2, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/app/common/utils'
import { CHART_COLORS, CHART_SERIES } from '@/app/charts/chart-theme'

export type KpiDashboardInput = {
  kpiIndicators: string[]
  kpiResults: string[]
  bestPractices?: string[]
}

export type KpiPair = {
  index: number
  indicator: string
  result: string
  complete: boolean
  /** ค่าเปอร์เซ็นต์ที่ดึงได้จาก Results (ถ้ามี) */
  progress?: number
}

function parseProgress(text: string): number | undefined {
  const pct = text.match(/(\d+(?:[.,]\d+)?)\s*%/)
  if (pct) {
    const n = Number(pct[1].replace(',', '.'))
    if (!Number.isNaN(n)) return Math.max(0, Math.min(100, n))
  }
  const frac = text.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/)
  if (frac) {
    const a = Number(frac[1].replace(',', '.'))
    const b = Number(frac[2].replace(',', '.'))
    if (!Number.isNaN(a) && !Number.isNaN(b) && b > 0) {
      return Math.max(0, Math.min(100, (a / b) * 100))
    }
  }
  return undefined
}

export function buildKpiPairs(input: KpiDashboardInput): KpiPair[] {
  const len = Math.max(input.kpiIndicators.length, input.kpiResults.length, 3)
  const pairs: KpiPair[] = []
  for (let i = 0; i < len; i++) {
    const indicator = (input.kpiIndicators[i] ?? '').trim()
    const result = (input.kpiResults[i] ?? '').trim()
    if (!indicator && !result) continue
    pairs.push({
      index: i + 1,
      indicator,
      result,
      complete: Boolean(indicator && result),
      progress: result ? parseProgress(result) : undefined,
    })
  }
  return pairs
}

export function hasKpiDashboardData(input: KpiDashboardInput): boolean {
  return buildKpiPairs(input).length > 0
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  hint?: string
  icon: typeof Target
  tone: 'primary' | 'green' | 'gold' | 'sky'
}) {
  const tones = {
    primary: 'from-primary/15 to-primary/5 text-primary',
    green: 'from-teal-500/15 to-teal-500/5 text-teal-700',
    gold: 'from-amber-500/15 to-amber-500/5 text-amber-700',
    sky: 'from-sky-500/15 to-sky-500/5 text-sky-700',
  }
  return (
    <div className="rounded-xl border border-border/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn('flex size-9 items-center justify-center rounded-xl bg-gradient-to-br', tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
    </div>
  )
}

/** Dashboard สรุป KPI / Results / Best Practice เมื่อกรอกข้อมูลแล้ว */
export function KpiResultsDashboard({
  data,
  className,
}: {
  data: KpiDashboardInput
  className?: string
}) {
  const pairs = buildKpiPairs(data)
  if (pairs.length === 0) return null

  const completeCount = pairs.filter((p) => p.complete).length
  const completionPct = Math.round((completeCount / pairs.length) * 100)
  const withProgress = pairs.filter((p) => p.progress != null)
  const avgProgress =
    withProgress.length > 0
      ? Math.round(withProgress.reduce((s, p) => s + (p.progress ?? 0), 0) / withProgress.length)
      : null

  const bestPractices = (data.bestPractices ?? []).map((b) => b.trim()).filter(Boolean)

  const radialData = [{ name: 'ครบคู่', value: completionPct, fill: CHART_COLORS.primary }]

  const barData = pairs.map((p, i) => ({
    name: `KPI ${p.index}`,
    label: p.indicator.slice(0, 28) || `KPI ${p.index}`,
    progress: p.progress ?? (p.complete ? 100 : p.indicator || p.result ? 45 : 0),
    fill: CHART_SERIES[i % CHART_SERIES.length],
    hasNumeric: p.progress != null,
  }))

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-ha-purple-soft/40 via-white to-ha-green-soft/30 shadow-[0_8px_28px_-14px_rgba(15,76,129,0.16)]',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 bg-gradient-to-r from-primary to-[#2b7bc0] px-4 py-2.5 sm:px-5">
        <div>
          <h3 className="text-sm font-bold text-white sm:text-base">KPI Results Dashboard</h3>
          <p className="text-[11px] text-white/85">สรุปตัวชี้วัด ผลลัพธ์ และแนวปฏิบัติที่เป็นเลิศ</p>
        </div>
        <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
          {completeCount}/{pairs.length} คู่ครบ
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="จำนวน KPI"
            value={pairs.length}
            hint="รายการที่มีการกรอก"
            icon={Target}
            tone="primary"
          />
          <StatCard
            label="คู่ครบ (KPI+Result)"
            value={completeCount}
            hint={`${completionPct}% ความครบถ้วน`}
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            label="ค่าเฉลี่ยผลลัพธ์"
            value={avgProgress != null ? `${avgProgress}%` : '—'}
            hint={avgProgress != null ? 'จากตัวเลข/% ใน Results' : 'ใส่ % หรือ ก/ข ใน Results เพื่อคำนวณ'}
            icon={TrendingUp}
            tone="sky"
          />
          <StatCard
            label="Best Practices"
            value={bestPractices.length}
            hint="แนวปฏิบัติที่เป็นเลิศ"
            icon={Award}
            tone="gold"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
          {/* Completion radial */}
          <div className="rounded-xl border border-border/70 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-foreground">ความครบถ้วนของข้อมูล</p>
            <p className="text-[10px] text-muted-foreground">สัดส่วนคู่ KPI ที่กรอกครบทั้งสองด้าน</p>
            <div className="relative mx-auto h-[160px] w-full max-w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="68%"
                  outerRadius="100%"
                  barSize={14}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(15,23,42,0.06)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold tabular-nums text-primary">{completionPct}%</p>
                <p className="text-[10px] text-muted-foreground">complete</p>
              </div>
            </div>
          </div>

          {/* Bar progress */}
          <div className="rounded-xl border border-border/70 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-foreground">ภาพรวมผลลัพธ์ตาม KPI</p>
            <p className="text-[10px] text-muted-foreground">
              {withProgress.length > 0
                ? 'ใช้ค่า % หรือสัดส่วนที่ระบุใน Results/Target'
                : 'ยังไม่มีตัวเลขใน Results — แสดงสถานะการกรอกแทน (ครบ = 100%)'}
            </p>
            <div className="mt-2 h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={48}
                    tick={{ fontSize: 11, fill: 'rgba(71,85,105,0.85)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: number, _n, item) => {
                      const row = item?.payload as (typeof barData)[number] | undefined
                      const suffix = row?.hasNumeric ? '%' : row?.progress === 100 ? ' (ครบคู่)' : ' (ยังไม่ครบ)'
                      return [`${val}${row?.hasNumeric ? '%' : ''}${suffix}`, row?.label || 'KPI']
                    }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid rgba(15,23,42,0.08)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={14}>
                    {barData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pair cards */}
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">รายการ KPI ↔ Results</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pairs.map((p, i) => (
              <div
                key={p.index}
                className={cn(
                  'overflow-hidden rounded-xl border bg-white shadow-sm',
                  p.complete ? 'border-teal-200' : 'border-amber-200'
                )}
              >
                <div
                  className="flex items-center justify-between gap-2 px-3 py-2 text-white"
                  style={{ background: CHART_SERIES[i % CHART_SERIES.length] }}
                >
                  <span className="text-xs font-bold">KPI {p.index}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      p.complete ? 'bg-white/25' : 'bg-black/20'
                    )}
                  >
                    {p.complete ? 'ครบคู่' : 'ยังไม่ครบ'}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Indicator
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                      {p.indicator || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Result / Target
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                      {p.result || '—'}
                    </p>
                    {p.progress != null ? (
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">ความคืบหน้า</span>
                          <span className="font-bold tabular-nums text-primary">{p.progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-teal-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best practices */}
        {bestPractices.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="size-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-900">Best Practice / Key Learnings</p>
            </div>
            <ul className="space-y-2">
              {bestPractices.map((item, i) => (
                <li
                  key={`${i}-${item.slice(0, 12)}`}
                  className="flex gap-2 rounded-lg border border-amber-100 bg-white/80 px-3 py-2 text-xs leading-relaxed text-slate-800"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                    {i + 1}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
