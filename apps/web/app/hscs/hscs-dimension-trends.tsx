'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { DotProps } from 'recharts'
import { cn } from '@/app/common/utils'
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from '@/app/charts/chart-theme'
import { getScoreBand, HSCS_BAND_STYLES } from '@/app/hscs/hscs-scoring'
import type { HscsTrendDataset, HscsTrendDimension } from '@/app/hscs/hscs-trend-data'

const BAND_DOT_COLORS = {
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#eab308',
  green: '#16a34a',
  grey: '#94a3b8',
} as const

type ChartRow = {
  year: string
  score: number | null
}

function toChartRows(dimension: HscsTrendDimension): ChartRow[] {
  return dimension.points.map((p) => ({
    year: String(p.year),
    score: p.score,
  }))
}

function computeYDomain(rows: ChartRow[]): [number, number] {
  const values = rows.map((r) => r.score).filter((s): s is number => s !== null)
  if (values.length === 0) return [0, 100]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(8, (max - min) * 0.35)
  return [Math.max(0, Math.floor(min - pad)), Math.min(100, Math.ceil(max + pad))]
}

function TrendValueDot(props: DotProps & { payload?: ChartRow }) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || payload?.score == null) return null

  const band = getScoreBand(payload.score)
  const fill = BAND_DOT_COLORS[band]

  return (
    <g>
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        className="fill-slate-700 text-[11px] font-bold"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        {payload.score.toFixed(1)}%
      </text>
      <circle cx={cx} cy={cy} r={7} fill={fill} stroke="#ffffff" strokeWidth={2.5} />
    </g>
  )
}

function TrendMiniChart({ dimension }: { dimension: HscsTrendDimension }) {
  const rows = toChartRows(dimension)
  const [yMin, yMax] = computeYDomain(rows)

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h4 className="mb-2 min-h-[2.75rem] text-[12px] font-bold leading-snug text-[#6d28d9]">
        {dimension.number}. {dimension.title}
      </h4>
      <div className="h-[9.5rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              tickLine={false}
              dy={4}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v) => `${v}`}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1e3a5f"
              strokeWidth={2.5}
              dot={(dotProps) => {
                const { key, cx, cy, payload, index } = dotProps
                return (
                  <TrendValueDot
                    key={key ?? `dot-${index}`}
                    cx={cx}
                    cy={cy}
                    payload={payload as ChartRow | undefined}
                  />
                )
              }}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

type HscsDimensionTrendsProps = {
  dataset: HscsTrendDataset
  className?: string
}

export function HscsDimensionTrends({ dataset, className }: HscsDimensionTrendsProps) {
  const displayUnit =
    dataset.unitLabel === 'ภาพรวมทั้งองค์กร'
      ? dataset.unitLabel
      : dataset.unitLabel.replace(/^งาน/, '')

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <header className="border-b border-slate-100 px-5 py-4 lg:px-6">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#6d28d9] to-[#0d9488]"
            aria-hidden
          />
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 lg:text-lg">
              แนวโน้มคะแนนเฉลี่ยรายมิติ
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              เปรียบเทียบคะแนนเฉลี่ยรายมิติของหน่วยงาน{' '}
              <span className="font-semibold text-[#6d28d9]">&apos;{displayUnit}&apos;</span>{' '}
              ระหว่างปี {dataset.compareFrom}–{dataset.compareTo}{' '}
              โดยแสดงเฉพาะปีที่พบชื่อหน่วยงานตรงกัน
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
          {(['red', 'orange', 'yellow', 'green'] as const).map((band) => (
            <span key={band} className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className={cn('size-2.5 rounded-full', HSCS_BAND_STYLES[band].bg)}
                aria-hidden
              />
              {band === 'red' && '< 60%'}
              {band === 'orange' && '60–70%'}
              {band === 'yellow' && '70.1–80%'}
              {band === 'green' && '> 80%'}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 lg:p-5">
        {dataset.dimensions.map((dimension) => (
          <TrendMiniChart key={dimension.id} dimension={dimension} />
        ))}
      </div>
    </section>
  )
}
