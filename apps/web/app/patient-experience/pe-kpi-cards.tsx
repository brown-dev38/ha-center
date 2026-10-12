import {
  Activity,
  HeartHandshake,
  MessageCircleHeart,
  ThumbsDown,
  Users,
  Star,
} from 'lucide-react'
import { cn } from '@/app/common/utils'
import { formatSatisfactionPercent } from '@/app/patient-experience/pe-survey-analytics'
import type { PeKpis } from '@/app/patient-experience/pe-types'

type PeKpiCardsProps = {
  kpis: PeKpis
}

const CARDS = [
  {
    key: 'respondents',
    label: 'จำนวนผู้ตอบ',
    icon: Users,
    tone: {
      panel:
        'from-sky-50 via-white to-sky-50/40 shadow-sky-200/50 ring-sky-100/80',
      bar: 'from-sky-400 to-sky-600',
      icon: 'bg-sky-500 text-white shadow-sky-500/35',
      value: 'text-sky-700',
      glow: 'bg-sky-400/20',
    },
  },
  {
    key: 'avg',
    label: 'คะแนนพึงพอใจเฉลี่ย',
    icon: Star,
    tone: {
      panel:
        'from-emerald-50 via-white to-emerald-50/40 shadow-emerald-200/50 ring-emerald-100/80',
      bar: 'from-emerald-400 to-emerald-600',
      icon: 'bg-emerald-500 text-white shadow-emerald-500/35',
      value: 'text-emerald-700',
      glow: 'bg-emerald-400/20',
    },
  },
  {
    key: 'health',
    label: 'สุขภาพผู้ป่วยโดยรวม',
    icon: Activity,
    tone: {
      panel:
        'from-violet-50 via-white to-violet-50/40 shadow-violet-200/50 ring-violet-100/80',
      bar: 'from-violet-400 to-violet-700',
      icon: 'bg-[#6d28d9] text-white shadow-violet-500/35',
      value: 'text-violet-700',
      glow: 'bg-violet-400/20',
    },
  },
  {
    key: 'return',
    label: '% กลับมาใช้บริการ',
    icon: HeartHandshake,
    tone: {
      panel:
        'from-rose-50 via-white to-rose-50/40 shadow-rose-200/50 ring-rose-100/80',
      bar: 'from-rose-400 to-rose-600',
      icon: 'bg-rose-500 text-white shadow-rose-500/35',
      value: 'text-rose-700',
      glow: 'bg-rose-400/20',
    },
  },
  {
    key: 'recommend',
    label: '% การแนะนำ (ข้อ 17)',
    icon: MessageCircleHeart,
    tone: {
      panel:
        'from-amber-50 via-white to-amber-50/40 shadow-amber-200/50 ring-amber-100/80',
      bar: 'from-amber-400 to-amber-600',
      icon: 'bg-amber-500 text-white shadow-amber-500/35',
      value: 'text-amber-700',
      glow: 'bg-amber-400/20',
    },
  },
  {
    key: 'dissatisfied',
    label: '% ไม่พึงพอใจ',
    icon: ThumbsDown,
    tone: {
      panel:
        'from-fuchsia-50 via-white to-fuchsia-50/40 shadow-fuchsia-200/50 ring-fuchsia-100/80',
      bar: 'from-fuchsia-400 to-fuchsia-600',
      icon: 'bg-fuchsia-500 text-white shadow-fuchsia-500/35',
      value: 'text-fuchsia-700',
      glow: 'bg-fuchsia-400/20',
    },
  },
] as const

export function PeKpiCards({ kpis }: PeKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {CARDS.map((card) => {
        let value = '—'
        switch (card.key) {
          case 'respondents':
            value = kpis.respondents.toLocaleString('th-TH')
            break
          case 'avg':
            value = formatSatisfactionPercent(kpis.avgSatisfaction)
            break
          case 'health':
            value = kpis.overallHealthLabel
            break
          case 'return':
            value = `${kpis.returnRate.toFixed(1)}%`
            break
          case 'recommend':
            value = `${kpis.recommendRate.toFixed(1)}%`
            break
          case 'dissatisfied':
            value = `${kpis.dissatisfactionRate.toFixed(1)}%`
            break
        }

        const Icon = card.icon

        return (
          <div
            key={card.key}
            className={cn(
              'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1',
              'border border-white/70',
              'shadow-[0_10px_24px_-12px_rgba(15,23,42,0.28),0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]',
              'transition-[transform,box-shadow] duration-300 ease-out',
              'hover:-translate-y-1 hover:shadow-[0_18px_36px_-14px_rgba(15,23,42,0.35),0_4px_10px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]',
              card.tone.panel
            )}
          >
            {/* top accent edge */}
            <span
              className={cn(
                'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
                card.tone.bar
              )}
              aria-hidden
            />
            {/* soft depth glow */}
            <span
              className={cn(
                'pointer-events-none absolute -right-6 -top-8 size-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100',
                card.tone.glow
              )}
              aria-hidden
            />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {card.label}
                </p>
                <p
                  className={cn(
                    'mt-2 font-heading text-2xl font-bold tracking-tight tabular-nums drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]',
                    card.tone.value
                  )}
                >
                  {value}
                </p>
              </div>
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_8px_16px_-6px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]',
                  'transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3',
                  card.tone.icon
                )}
              >
                <Icon className="size-4" strokeWidth={2.25} />
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
