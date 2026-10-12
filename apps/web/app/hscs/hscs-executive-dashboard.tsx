'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HaLogo } from '@/app/brand/ha-logo'
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from '@/app/charts/chart-theme'
import { cn } from '@/app/common/utils'
import { getScoreBand, HSCS_BAND_STYLES } from '@/app/hscs/hscs-scoring'
import type { HscsExecutiveDashboard } from '@/app/hscs/server/hscs-analytics-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

async function fetchDashboard(params: {
  department: string
  dateFrom: string
  dateTo: string
}): Promise<HscsExecutiveDashboard> {
  const qs = new URLSearchParams()
  if (params.department && params.department !== 'all') {
    qs.set('department', params.department)
  }
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom)
  if (params.dateTo) qs.set('dateTo', params.dateTo)
  const res = await fetch(`/api/v1/hscs/dashboard?${qs.toString()}`, {
    cache: 'no-store',
  })
  const json = (await res.json()) as {
    ok: boolean
    data?: HscsExecutiveDashboard
    error?: string
    hint?: string
  }
  if (!res.ok || !json.ok || !json.data) {
    throw new Error([json.error, json.hint].filter(Boolean).join(' — '))
  }
  return json.data
}

function bandFill(pct: number | null): string {
  const band = getScoreBand(pct)
  if (band === 'green') return '#16a34a'
  if (band === 'yellow') return '#eab308'
  if (band === 'orange') return '#ea580c'
  if (band === 'red') return '#dc2626'
  return '#94a3b8'
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(',')
    )
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function HscsExecutiveDashboard() {
  const [department, setDepartment] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [chartMode, setChartMode] = useState<'radar' | 'bar'>('radar')
  const [suggestionQuery, setSuggestionQuery] = useState('')

  const query = useQuery({
    queryKey: ['hscs-dashboard', department, dateFrom, dateTo],
    queryFn: () => fetchDashboard({ department, dateFrom, dateTo }),
    staleTime: 30_000,
  })

  const data = query.data

  const filteredSuggestions = useMemo(() => {
    if (!data) return []
    const q = suggestionQuery.trim().toLowerCase()
    if (!q) return data.suggestions
    return data.suggestions.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.staffId.toLowerCase().includes(q)
    )
  }, [data, suggestionQuery])

  const radarData =
    data?.dimensions.map((d) => ({
      section: d.section,
      name: d.section,
      positive: d.positivePct !== null ? Math.round(d.positivePct * 10) / 10 : 0,
      mean: d.mean !== null ? Math.round(d.mean * 100) / 100 : 0,
    })) ?? []

  const heatDepts = useMemo(() => {
    if (!data) return []
    return [...new Set(data.heatmap.map((h) => h.department))]
  }, [data])

  const heatSections = useMemo(() => {
    if (!data) return []
    return [...new Set(data.heatmap.map((h) => h.section))]
  }, [data])

  const heatLookup = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const cell of data?.heatmap ?? []) {
      map.set(`${cell.department}::${cell.section}`, cell.positivePct)
    }
    return map
  }, [data])

  const handleExport = () => {
    if (!data) return
    const rows: string[][] = [
      ['HSCS Executive Export', data.sourceFile, data.generatedAt],
      [],
      ['KPI', 'Value'],
      ['Total Respondents', String(data.kpis.totalRespondents)],
      ['Overall Positive %', data.kpis.overallPositivePct?.toFixed(1) ?? ''],
      ['Safety Grade Avg (E)', data.kpis.safetyGradeAvg?.toFixed(2) ?? ''],
      ['Incident Reporting Index (D+G)', data.kpis.incidentReportingIndex?.toFixed(2) ?? ''],
      [],
      ['Dimension', 'Positive %', 'Mean', 'N'],
      ...data.dimensions.map((d) => [
        d.title,
        d.positivePct?.toFixed(1) ?? '',
        d.mean?.toFixed(2) ?? '',
        String(d.n),
      ]),
      [],
      ['Top Strengths'],
      ['Code', 'Label', 'Positive %', 'Mean'],
      ...data.topStrengths.map((q) => [
        q.code,
        q.label,
        q.positivePct?.toFixed(1) ?? '',
        q.mean?.toFixed(2) ?? '',
      ]),
      [],
      ['Areas for Improvement'],
      ['Code', 'Label', 'Positive %', 'Mean'],
      ...data.topImprovements.map((q) => [
        q.code,
        q.label,
        q.positivePct?.toFixed(1) ?? '',
        q.mean?.toFixed(2) ?? '',
      ]),
      [],
      ['Suggestions (Section H)'],
      ['Staff ID', 'Department', 'Text'],
      ...data.suggestions.map((s) => [s.staffId, s.department, s.text]),
    ]
    downloadCsv(`hscs-report-${department}-${Date.now()}.csv`, rows)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.22)]">
      <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col lg:flex-row">
        {/* Sidebar filters */}
        <aside className="flex w-full shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:w-[17rem]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200">
              Executive Analytics
            </p>
            <h2 className="font-heading text-lg font-bold text-white">UPH-HSCS</h2>
            <p className="mt-0.5 text-[11px] text-violet-100/90">
              Safety Climate Survey Dashboard
            </p>
          </div>

          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">แผนก / วิชาชีพ</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
              >
                <option value="all">ทั้งหมด</option>
                {(data?.departments ?? []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">วันที่เริ่มต้น</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">วันที่สิ้นสุด</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-white"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw className={cn('size-3.5', query.isFetching && 'animate-spin')} />
              Reload data
            </Button>

            <Button type="button" className="w-full gap-2" onClick={handleExport} disabled={!data}>
              <Download className="size-3.5" />
              Export CSV report
            </Button>
          </div>

          <div className="mt-auto space-y-2 border-t border-slate-200 p-4 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">เกณฑ์สี (% Positive)</p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#16a34a]" /> &gt; 80% ดี
            </p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#eab308]" /> 70–80% เฝ้าระวัง
            </p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#ea580c]" /> 60–70% เสี่ยง
            </p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#dc2626]" /> &lt; 60% สูง
            </p>
            {data?.sourceFile && (
              <p className="pt-2 text-[10px] text-slate-400">Source: {data.sourceFile}</p>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 bg-[#f8fafc]">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
            <div>
              <p className="text-xs font-semibold text-slate-500">Hospital Survey on Culture of Safety</p>
              <p className="font-heading text-sm font-bold text-slate-900">
                Executive Dashboard · ปี 2569
              </p>
            </div>
            <HaLogo size="sm" className="opacity-90" />
          </header>

          <div className="space-y-5 p-4 lg:p-6">
            {query.isLoading && (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin text-[#6d28d9]" />
                กำลังประมวลผลข้อมูล Excel...
              </div>
            )}

            {query.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
                <p className="font-semibold">โหลดข้อมูลไม่สำเร็จ</p>
                <p className="mt-1">{(query.error as Error).message}</p>
                <p className="mt-3 text-xs text-rose-600">
                  วางไฟล์จริงที่ <code>apps/web/data/hscs/HSCS69.xlsx</code> หรือรัน{' '}
                  <code>bun scripts/generate-hscs-sample.mjs</code>
                </p>
              </div>
            )}

            {data && (
              <>
                {data.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {data.warnings.join(' · ')}
                  </div>
                )}

                {/* KPI cards */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    icon={Users}
                    label="Total Respondents"
                    value={data.kpis.totalRespondents.toLocaleString('th-TH')}
                    tone="violet"
                  />
                  <KpiCard
                    icon={ShieldCheck}
                    label="Overall Positive Score"
                    value={
                      data.kpis.overallPositivePct !== null
                        ? `${data.kpis.overallPositivePct.toFixed(1)}%`
                        : '—'
                    }
                    tone={
                      getScoreBand(data.kpis.overallPositivePct) === 'green'
                        ? 'green'
                        : getScoreBand(data.kpis.overallPositivePct) === 'red'
                          ? 'red'
                          : 'amber'
                    }
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Avg Safety Grade (E)"
                    value={
                      data.kpis.safetyGradeAvg !== null
                        ? data.kpis.safetyGradeAvg.toFixed(2)
                        : '—'
                    }
                    tone="green"
                    hint="คะแนนเฉลี่ย Section E (1–5)"
                  />
                  <KpiCard
                    icon={AlertTriangle}
                    label="Incident Reporting Index"
                    value={
                      data.kpis.incidentReportingIndex !== null
                        ? data.kpis.incidentReportingIndex.toFixed(2)
                        : '—'
                    }
                    tone="amber"
                    hint="ค่าเฉลี่ย Section D + G"
                  />
                </div>

                {/* Dimension charts */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900">
                        คะแนนเฉลี่ยรายมิติ (A / B / C / D / F)
                      </h3>
                      <p className="text-sm text-slate-500">% Positive Response ตามมิติ</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={chartMode === 'radar' ? 'default' : 'outline'}
                        onClick={() => setChartMode('radar')}
                      >
                        Radar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={chartMode === 'bar' ? 'default' : 'outline'}
                        onClick={() => setChartMode('bar')}
                      >
                        Bar
                      </Button>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMode === 'radar' ? (
                        <RadarChart data={radarData}>
                          <PolarGrid stroke={CHART_GRID_COLOR} />
                          <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }} />
                          <Radar
                            name="% Positive"
                            dataKey="positive"
                            stroke="#6d28d9"
                            fill="#6d28d9"
                            fillOpacity={0.25}
                          />
                          <Tooltip />
                        </RadarChart>
                      ) : (
                        <BarChart data={radarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART_AXIS_COLOR }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                          <Tooltip />
                          <Bar dataKey="positive" name="% Positive" radius={[8, 8, 0, 0]}>
                            {radarData.map((entry) => (
                              <Cell key={entry.section} fill={bandFill(entry.positive)} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Heatmap */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="font-heading text-base font-bold text-slate-900">
                      Heatmap: แผนก × มิติ (% Positive)
                    </h3>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-500">
                            แผนก
                          </th>
                          {heatSections.map((s) => (
                            <th
                              key={s}
                              className="px-2 py-2 text-center text-xs font-bold text-[#6d28d9]"
                            >
                              {s}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatDepts.map((dept) => (
                          <tr key={dept}>
                            <td className="sticky left-0 max-w-[12rem] truncate bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                              {dept}
                            </td>
                            {heatSections.map((section) => {
                              const pct = heatLookup.get(`${dept}::${section}`) ?? null
                              const band = getScoreBand(pct)
                              const styles = HSCS_BAND_STYLES[band]
                              return (
                                <td key={section} className="px-1 py-1">
                                  <div
                                    className={cn(
                                      'rounded-md px-2 py-2 text-center text-[11px] font-bold',
                                      styles.bg,
                                      styles.text
                                    )}
                                    title={`${dept} / ${section}`}
                                  >
                                    {pct !== null ? `${pct.toFixed(0)}%` : '—'}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Ranking */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <RankPanel
                    title="Top 5 Strengths"
                    icon={TrendingUp}
                    tone="green"
                    items={data.topStrengths}
                  />
                  <RankPanel
                    title="Top 5 Areas for Improvement"
                    icon={TrendingDown}
                    tone="red"
                    items={data.topImprovements}
                  />
                </div>

                {/* Section H */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900">
                        Qualitative Insights — Section H
                      </h3>
                      <p className="text-sm text-slate-500">
                        ข้อเสนอแนะ / ความคิดเห็น ({filteredSuggestions.length} รายการ)
                      </p>
                    </div>
                    <div className="relative w-full max-w-xs">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={suggestionQuery}
                        onChange={(e) => setSuggestionQuery(e.target.value)}
                        placeholder="ค้นหาข้อความ / แผนก / รหัส..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="max-h-[28rem] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="w-28">รหัส</TableHead>
                          <TableHead className="w-48">แผนก</TableHead>
                          <TableHead>ข้อเสนอแนะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuggestions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="py-10 text-center text-slate-400">
                              ไม่พบข้อความ Section H
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSuggestions.slice(0, 200).map((s, i) => (
                            <TableRow key={`${s.staffId}-${i}`}>
                              <TableCell className="font-mono text-xs text-slate-500">
                                {s.staffId}
                              </TableCell>
                              <TableCell className="text-sm text-slate-700">{s.department}</TableCell>
                              <TableCell className="text-sm text-slate-800">{s.text}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Users
  label: string
  value: string
  tone: 'violet' | 'green' | 'amber' | 'red'
  hint?: string
}) {
  const tones = {
    violet: 'from-violet-500/10 to-white text-[#6d28d9]',
    green: 'from-emerald-500/10 to-white text-emerald-700',
    amber: 'from-amber-500/10 to-white text-amber-700',
    red: 'from-rose-500/10 to-white text-rose-700',
  }
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-gradient-to-br p-4 shadow-sm',
        tones[tone]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <Icon className="size-4 opacity-70" />
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

function RankPanel({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string
  icon: typeof TrendingUp
  tone: 'green' | 'red'
  items: HscsExecutiveDashboard['topStrengths']
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn('size-4', tone === 'green' ? 'text-emerald-600' : 'text-rose-600')} />
        <h3 className="font-heading text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li
            key={item.key}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#6d28d9]">{item.code}</p>
              <p className="truncate text-sm text-slate-800" title={item.label}>
                {item.label}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  'text-sm font-bold tabular-nums',
                  tone === 'green' ? 'text-emerald-700' : 'text-rose-700'
                )}
              >
                {item.positivePct !== null ? `${item.positivePct.toFixed(1)}%` : '—'}
              </p>
              <p className="text-[10px] text-slate-400">
                mean {item.mean?.toFixed(2) ?? '—'}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
