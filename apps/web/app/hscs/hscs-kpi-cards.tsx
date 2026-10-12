import {
  AlertTriangle,
  ClipboardList,
  Layers,
  ListTree,
  Users,
} from 'lucide-react'
import { cn } from '@/app/common/utils'
import {
  formatScore,
  getScoreBand,
  HSCS_BAND_LABELS,
} from '@/app/hscs/hscs-scoring'
import type { HscsSummary } from '@/app/hscs/hscs-types'

type HscsKpiCardsProps = {
  summary: HscsSummary
}

const KPI_CARDS = [
  {
    key: 'overall',
    label: 'คะแนนเชิงบวกรวม',
    icon: ClipboardList,
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
    key: 'respondents',
    label: 'จำนวนผู้ตอบแบบสอบถาม',
    icon: Users,
    tone: {
      panel:
        'from-emerald-50 via-white to-emerald-50/40 shadow-emerald-200/50 ring-emerald-100/80',
      bar: 'from-emerald-400 to-emerald-600',
      icon: 'bg-emerald-500 text-white shadow-emerald-500/35',
      value: 'text-slate-900',
      glow: 'bg-emerald-400/20',
    },
  },
  {
    key: 'main',
    label: 'มิติหลัก',
    icon: Layers,
    tone: {
      panel:
        'from-fuchsia-50 via-white to-fuchsia-50/40 shadow-fuchsia-200/50 ring-fuchsia-100/80',
      bar: 'from-fuchsia-400 to-fuchsia-600',
      icon: 'bg-fuchsia-500 text-white shadow-fuchsia-500/35',
      value: 'text-slate-900',
      glow: 'bg-fuchsia-400/20',
    },
  },
  {
    key: 'sub',
    label: 'ข้อย่อย',
    icon: ListTree,
    tone: {
      panel:
        'from-amber-50 via-white to-amber-50/40 shadow-amber-200/50 ring-amber-100/80',
      bar: 'from-amber-400 to-amber-600',
      icon: 'bg-amber-500 text-white shadow-amber-500/35',
      value: 'text-slate-900',
      glow: 'bg-amber-400/20',
    },
  },
  {
    key: 'urgent',
    label: 'รายการที่ต้องเร่งพัฒนา',
    icon: AlertTriangle,
    tone: {
      panel:
        'from-rose-50 via-white to-rose-50/40 shadow-rose-200/50 ring-rose-100/80',
      bar: 'from-rose-400 to-rose-600',
      icon: 'bg-rose-500 text-white shadow-rose-500/35',
      value: 'text-[#dc2626]',
      glow: 'bg-rose-400/20',
    },
  },
] as const

function overallValueClass(band: ReturnType<typeof getScoreBand>): string {
  if (band === 'green') return 'text-[#16a34a]'
  if (band === 'yellow') return 'text-[#a16207]'
  if (band === 'orange') return 'text-[#ea580c]'
  if (band === 'red') return 'text-[#dc2626]'
  return 'text-[#6d28d9]'
}

export function HscsKpiCards({ summary }: HscsKpiCardsProps) {
  const overallBand = getScoreBand(summary.overallScore)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {KPI_CARDS.map((card) => {
        let value: string
        let sub: string | null = null
        let valueClass = card.tone.value

        switch (card.key) {
          case 'overall':
            value = formatScore(summary.overallScore)
            sub = HSCS_BAND_LABELS[overallBand]
            valueClass = overallValueClass(overallBand)
            break
          case 'respondents':
            value = `${summary.respondents.toLocaleString('th-TH')} คน`
            break
          case 'main':
            value = `${summary.mainDimensions} มิติ`
            break
          case 'sub':
            value = `${summary.subDimensions} ข้อ`
            break
          case 'urgent':
            value = `${summary.urgentCount}`
            sub = `เร่งพัฒนา ${summary.urgentItems} ข้อ`
            break
          default:
            value = '—'
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
            <span
              className={cn(
                'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
                card.tone.bar
              )}
              aria-hidden
            />
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
                    valueClass
                  )}
                >
                  {value}
                </p>
                {sub ? (
                  <p
                    className={cn(
                      'mt-1 text-xs font-semibold',
                      card.key === 'urgent' ? 'text-rose-600' : 'text-slate-500'
                    )}
                  >
                    {sub}
                  </p>
                ) : null}
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
