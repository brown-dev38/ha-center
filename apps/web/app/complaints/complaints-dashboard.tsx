'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  type LucideIcon,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_SERIES } from '@/app/charts/chart-theme'
import { ComplaintsFrame } from '@/app/complaints/complaints-frame'
import {
  COMPLAINT_KIND_LABEL,
  COMPLAINT_PRIORITY_LABEL,
  COMPLAINT_STATUS_LABEL,
  formatThaiDate,
  type ComplaintCase,
  type ComplaintKind,
  type ComplaintStatus,
} from '@/app/complaints/complaint-model'
import { loadComplaintCases } from '@/app/complaints/complaint-store'
import { cn } from '@/app/common/utils'
import { buttonVariants } from '@/components/ui/button'

const KIND_ORDER: ComplaintKind[] = ['complaint', 'suggestion', 'comment', 'document', 'risk']
const STATUS_ORDER: ComplaintStatus[] = ['new', 'accepted', 'in_progress', 'replied', 'closed']

const STATUS_BAR: Record<ComplaintStatus, string> = {
  new: 'bg-sky-500',
  accepted: 'bg-violet-500',
  in_progress: 'bg-amber-500',
  replied: 'bg-teal-500',
  closed: 'bg-emerald-500',
}

const KPI_TONES = {
  total: {
    panel: 'from-violet-50 via-white to-violet-50/40 shadow-violet-200/50 ring-violet-100/80',
    bar: 'from-violet-400 to-violet-700',
    icon: 'bg-[#6d28d9] text-white shadow-violet-500/35',
    value: 'text-violet-700',
    glow: 'bg-violet-400/20',
  },
  queue: {
    panel: 'from-sky-50 via-white to-sky-50/40 shadow-sky-200/50 ring-sky-100/80',
    bar: 'from-sky-400 to-sky-600',
    icon: 'bg-sky-500 text-white shadow-sky-500/35',
    value: 'text-slate-900',
    glow: 'bg-sky-400/20',
  },
  active: {
    panel: 'from-amber-50 via-white to-amber-50/40 shadow-amber-200/50 ring-amber-100/80',
    bar: 'from-amber-400 to-amber-600',
    icon: 'bg-amber-500 text-white shadow-amber-500/35',
    value: 'text-slate-900',
    glow: 'bg-amber-400/20',
  },
  closed: {
    panel: 'from-emerald-50 via-white to-emerald-50/40 shadow-emerald-200/50 ring-emerald-100/80',
    bar: 'from-emerald-400 to-emerald-600',
    icon: 'bg-emerald-500 text-white shadow-emerald-500/35',
    value: 'text-emerald-700',
    glow: 'bg-emerald-400/20',
  },
} as const

export function ComplaintsDashboard() {
  const [cases, setCases] = useState<ComplaintCase[]>([])

  useEffect(() => {
    setCases(loadComplaintCases())
  }, [])

  const stats = useMemo(() => summarize(cases), [cases])

  return (
    <ComplaintsFrame
      title="แดชบอร์ดรับเรื่อง"
      description="ภาพรวมเรื่องร้องเรียน ข้อเสนอแนะ และความคิดเห็น พร้อมสถานะที่ยังต้องติดตาม"
      actions={
        <Link href="/dashboard/complaints/import" className={buttonVariants()}>
          นำเข้า Excel
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="เรื่องทั้งหมด"
          value={stats.total}
          hint={stats.total ? `เร่งด่วนที่ยังไม่ปิด ${stats.urgent.toLocaleString('th-TH')} เรื่อง` : 'ยังไม่นำเข้าไฟล์'}
          icon={Inbox}
          tone={KPI_TONES.total}
          alert={stats.urgent > 0}
        />
        <KpiCard
          label="รอรับเรื่อง"
          value={stats.queue}
          hint="สถานะใหม่และรับเรื่องแล้ว"
          icon={Clock3}
          tone={KPI_TONES.queue}
        />
        <KpiCard
          label="กำลังดำเนินการ"
          value={stats.active}
          hint="อยู่ระหว่างตรวจสอบและตอบกลับ"
          icon={ClipboardList}
          tone={KPI_TONES.active}
        />
        <KpiCard
          label="ปิดเรื่องแล้ว"
          value={stats.closed}
          hint={stats.total ? `คิดเป็น ${stats.closureRate.toFixed(1)}% ของทั้งหมด` : 'ยังไม่มีเรื่องที่ปิด'}
          icon={CheckCircle2}
          tone={KPI_TONES.closed}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">ประเภทเรื่อง</p>
              <h2 className="mt-1 font-heading text-base font-bold text-slate-900">สัดส่วนตามเนื้อหา</h2>
            </div>
            <p className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium tabular-nums text-slate-500">
              n = {stats.total.toLocaleString('th-TH')}
            </p>
          </header>
          {stats.kindChart.length === 0 ? (
            <EmptyChart label="นำเข้า Excel เพื่อให้ระบบแยกประเภทร้องเรียน ข้อเสนอแนะ และความเสี่ยง" />
          ) : (
            <div className="mt-2 grid items-center gap-2 sm:grid-cols-[180px_1fr]">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.kindChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={74}
                      paddingAngle={stats.kindChart.length > 1 ? 2 : 0}
                      stroke="none"
                    >
                      {stats.kindChart.map((entry) => (
                        <Cell key={entry.kind} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const row = item?.payload as { name?: string; pct?: number } | undefined
                        const count = typeof value === 'number' ? value : Number(value ?? 0)
                        return [`${count.toLocaleString('th-TH')} เรื่อง (${row?.pct ?? 0}%)`, row?.name ?? '']
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {stats.kindChart.map((entry) => (
                  <li key={entry.kind} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{entry.name}</span>
                    <span className="tabular-nums font-semibold text-slate-900">{entry.pct.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-3">
          <header>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">สถานะงาน</p>
            <h2 className="mt-1 font-heading text-base font-bold text-slate-900">คิวตั้งแต่รับเรื่องจนปิด</h2>
          </header>
          <ul className="mt-5 space-y-3.5">
            {STATUS_ORDER.map((status) => {
              const count = stats.byStatus[status] ?? 0
              const width = stats.total ? Math.max(count > 0 ? 4 : 0, (count / stats.total) * 100) : 0
              return (
                <li key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{COMPLAINT_STATUS_LABEL[status]}</span>
                    <span className="tabular-nums font-semibold text-slate-900">{count.toLocaleString('th-TH')}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', STATUS_BAR[status])} style={{ width: `${width}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">หน่วยงาน</p>
              <h2 className="mt-1 font-heading text-base font-bold text-slate-900">เรื่องที่มอบหมายแล้ว</h2>
            </div>
          </header>
          {stats.departments.length === 0 ? (
            <EmptyChart label="ยังไม่มีเรื่องให้จัดหน่วยงาน" />
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.departments.map((row) => (
                <li key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate text-slate-700">{row.label}</span>
                    <span className="tabular-nums font-semibold text-slate-900">{row.count.toLocaleString('th-TH')}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#6d28d9]" style={{ width: `${row.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-3">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">ล่าสุด</p>
              <h2 className="mt-1 font-heading text-base font-bold text-slate-900">เรื่องที่ต้องมองก่อน</h2>
            </div>
            <Link
              href="/dashboard/complaints/registry"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#6d28d9]"
            >
              ทะเบียนทั้งหมด
              <ArrowUpRight className="size-3.5" />
            </Link>
          </header>
          {stats.recent.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyChart label="เมื่อนำเข้าไฟล์แล้ว เรื่องล่าสุดจะแสดงในตารางนี้" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recent.map((item) => (
                <li key={item.id} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-medium text-slate-900">{item.caseNo}</p>
                    <p className="text-xs text-slate-400">{formatThaiDate(item.submittedAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm text-slate-700">{item.detail}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {COMPLAINT_KIND_LABEL[item.kind]} · {item.department}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:justify-end">
                    <Pill className={item.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}>
                      {item.priority === 'urgent' ? <AlertTriangle className="size-3" /> : null}
                      {COMPLAINT_PRIORITY_LABEL[item.priority]}
                    </Pill>
                    <Pill className="bg-violet-50 text-violet-700">{COMPLAINT_STATUS_LABEL[item.status]}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </ComplaintsFrame>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  alert = false,
}: {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  tone: (typeof KPI_TONES)[keyof typeof KPI_TONES]
  alert?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1',
        'border border-white/70 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.28),0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
        tone.panel
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', tone.bar)} aria-hidden />
      <span className={cn('pointer-events-none absolute -right-6 -top-8 size-24 rounded-full blur-2xl', tone.glow)} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className={cn('mt-2 font-heading text-3xl font-bold tracking-tight tabular-nums', tone.value)}>
            {value.toLocaleString('th-TH')}
          </p>
          <p className={cn('mt-1 text-xs font-medium', alert ? 'text-rose-600' : 'text-slate-500')}>{hint}</p>
        </div>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_8px_16px_-6px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]',
            tone.icon
          )}
        >
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
      <div className="mb-3 size-14 rounded-full border-4 border-dashed border-slate-200" aria-hidden />
      <p className="text-sm font-medium text-slate-600">ยังไม่มีข้อมูล</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">{label}</p>
    </div>
  )
}

function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', className)}>
      {children}
    </span>
  )
}

function summarize(cases: ComplaintCase[]) {
  const byKind: Partial<Record<ComplaintKind, number>> = {}
  const byStatus: Partial<Record<ComplaintStatus, number>> = {}
  const byDepartment = new Map<string, number>()
  let queue = 0
  let active = 0
  let closed = 0
  let urgent = 0

  for (const item of cases) {
    byKind[item.kind] = (byKind[item.kind] ?? 0) + 1
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1
    byDepartment.set(item.department || 'ไม่ระบุ', (byDepartment.get(item.department || 'ไม่ระบุ') ?? 0) + 1)
    if (item.status === 'new' || item.status === 'accepted') queue += 1
    if (item.status === 'in_progress' || item.status === 'replied') active += 1
    if (item.status === 'closed') closed += 1
    if (item.priority === 'urgent' && item.status !== 'closed') urgent += 1
  }

  const total = cases.length
  const kindChart = KIND_ORDER.filter((kind) => (byKind[kind] ?? 0) > 0).map((kind, index) => {
    const value = byKind[kind] ?? 0
    return {
      kind,
      name: COMPLAINT_KIND_LABEL[kind],
      value,
      pct: total ? Math.round((value / total) * 1000) / 10 : 0,
      color: CHART_SERIES[index % CHART_SERIES.length],
    }
  })

  const maxDept = Math.max(1, ...byDepartment.values())
  const departments = [...byDepartment.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / maxDept) * 1000) / 10,
    }))

  const ranked = [...cases].sort((a, b) => {
    const urgentRank = Number(b.priority === 'urgent') - Number(a.priority === 'urgent')
    if (urgentRank) return urgentRank
    return a.submittedAt < b.submittedAt ? 1 : -1
  })

  return {
    total,
    queue,
    active,
    closed,
    urgent,
    closureRate: total ? (closed / total) * 100 : 0,
    byStatus,
    kindChart,
    departments,
    recent: ranked.slice(0, 6),
  }
}
