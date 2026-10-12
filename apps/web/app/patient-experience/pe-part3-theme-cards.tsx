'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Cpu,
  HeartHandshake,
  Megaphone,
  MessageCircle,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/app/common/utils'
import {
  PE_PART3_SHORT_LABELS,
  PE_PART3_THEME_DESCRIPTIONS,
  sharePercents,
} from '@/app/patient-experience/pe-survey-form-content'
import type { PeComment } from '@/app/patient-experience/pe-types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type PePart3ThemeFilter = number | 'other' | 'all'

type ThemeCardDef = {
  key: PePart3ThemeFilter
  index: number
  title: string
  description: string
  icon: LucideIcon
  accent: string
  accentSoft: string
  accentBorder: string
  iconBg: string
  bar: string
}

const THEME_CARDS: ThemeCardDef[] = [
  {
    key: 0,
    index: 1,
    title: PE_PART3_SHORT_LABELS[0] ?? 'ด้านบุคลากร',
    description: PE_PART3_THEME_DESCRIPTIONS[0] ?? '',
    icon: Users,
    accent: 'text-violet-700',
    accentSoft: 'bg-violet-50',
    accentBorder: 'border-violet-200 hover:border-violet-400',
    iconBg: 'bg-violet-100 text-violet-700',
    bar: 'bg-violet-500',
  },
  {
    key: 1,
    index: 2,
    title: PE_PART3_SHORT_LABELS[1] ?? 'ด้านบริการ',
    description: PE_PART3_THEME_DESCRIPTIONS[1] ?? '',
    icon: HeartHandshake,
    accent: 'text-sky-700',
    accentSoft: 'bg-sky-50',
    accentBorder: 'border-sky-200 hover:border-sky-400',
    iconBg: 'bg-sky-100 text-sky-700',
    bar: 'bg-sky-500',
  },
  {
    key: 2,
    index: 3,
    title: PE_PART3_SHORT_LABELS[2] ?? 'ด้านอาคารสถานที่',
    description: PE_PART3_THEME_DESCRIPTIONS[2] ?? '',
    icon: Building2,
    accent: 'text-teal-700',
    accentSoft: 'bg-teal-50',
    accentBorder: 'border-teal-200 hover:border-teal-400',
    iconBg: 'bg-teal-100 text-teal-700',
    bar: 'bg-teal-500',
  },
  {
    key: 3,
    index: 4,
    title: PE_PART3_SHORT_LABELS[3] ?? 'ด้านอุปกรณ์เทคโนโลยี',
    description: PE_PART3_THEME_DESCRIPTIONS[3] ?? '',
    icon: Cpu,
    accent: 'text-amber-700',
    accentSoft: 'bg-amber-50',
    accentBorder: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-100 text-amber-700',
    bar: 'bg-amber-500',
  },
  {
    key: 4,
    index: 5,
    title: PE_PART3_SHORT_LABELS[4] ?? 'ด้านการประชาสัมพันธ์/ติดต่อ',
    description: PE_PART3_THEME_DESCRIPTIONS[4] ?? '',
    icon: Megaphone,
    accent: 'text-rose-700',
    accentSoft: 'bg-rose-50',
    accentBorder: 'border-rose-200 hover:border-rose-400',
    iconBg: 'bg-rose-100 text-rose-700',
    bar: 'bg-rose-500',
  },
  {
    key: 'other',
    index: 0,
    title: 'อื่น ๆ',
    description: 'ความคิดเห็นที่ยังจัดเข้า 5 ด้านหลักไม่ได้',
    icon: MessageCircle,
    accent: 'text-[#6d28d9]',
    accentSoft: 'bg-violet-50/80',
    accentBorder: 'border-violet-300 hover:border-[#6d28d9]',
    iconBg: 'bg-[#6d28d9]/10 text-[#6d28d9]',
    bar: 'bg-[#6d28d9]',
  },
]

function commentMatchesTheme(c: PeComment, theme: PePart3ThemeFilter): boolean {
  if (theme === 'all') return true
  if (theme === 'other') {
    return c.part3ThemeIndex == null || c.part3ThemeIndex < 0
  }
  return c.part3ThemeIndex === theme
}

function sentimentLabel(s: PeComment['sentiment']) {
  if (s === 'positive') return 'เชิงบวก'
  if (s === 'negative') return 'เชิงลบ'
  return 'กลาง'
}

type PePart3ThemeCardsProps = {
  comments: PeComment[]
  counts: number[]
  otherCount: number
  selectedTheme: PePart3ThemeFilter
  onSelectTheme: (theme: PePart3ThemeFilter) => void
}

export function PePart3ThemeCards({
  comments,
  counts,
  otherCount,
  selectedTheme,
  onSelectTheme,
}: PePart3ThemeCardsProps) {
  const [detailTheme, setDetailTheme] = useState<PePart3ThemeFilter | null>(null)
  const [detailQuery, setDetailQuery] = useState('')

  const openCard = (theme: PePart3ThemeFilter) => {
    onSelectTheme(theme === selectedTheme ? 'all' : theme)
    setDetailQuery('')
    setDetailTheme(theme)
  }

  const activeDef = THEME_CARDS.find((c) => c.key === detailTheme) ?? null
  const ActiveIcon = activeDef?.icon

  const detailComments = useMemo(() => {
    if (detailTheme == null) return []
    const list = comments.filter((c) => commentMatchesTheme(c, detailTheme))
    const q = detailQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    )
  }, [comments, detailTheme, detailQuery])

  const themeCounts = useMemo(
    () => [...counts.slice(0, 5), otherCount],
    [counts, otherCount]
  )
  const themePcts = useMemo(() => sharePercents(themeCounts), [themeCounts])
  const totalComments = themeCounts.reduce((s, n) => s + n, 0)

  return (
    <>
      <div className="grid gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-5 py-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEME_CARDS.map((card, cardIndex) => {
          const count = themeCounts[cardIndex] ?? 0
          const pct = themePcts[cardIndex] ?? 0
          const selected = selectedTheme === card.key
          const Icon = card.icon

          return (
            <button
              key={String(card.key)}
              type="button"
              onClick={() => openCard(card.key)}
              className={cn(
                'group relative flex h-full flex-col rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition',
                'hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]/35',
                card.accentBorder,
                selected && cn(card.accentSoft, 'ring-2 ring-[#6d28d9]/25'),
                card.key === 'other' && count > 0 && !selected && 'bg-violet-50/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      card.iconBg
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className={cn('text-[11px] font-bold tracking-wide', card.accent)}>
                      {card.key === 'other' ? card.title : `${card.index}.${card.title}`}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-600">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold tabular-nums leading-none text-slate-900">
                    {pct.toFixed(1)}
                    <span className="ml-0.5 text-sm font-semibold text-slate-500">%</span>
                  </p>
                  <p className="mt-1 text-[10px] font-medium tabular-nums text-slate-400">
                    {count.toLocaleString('th-TH')} รายการ
                  </p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn('h-full rounded-full transition-all', card.bar)}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              <div
                className={cn(
                  'mt-3 flex items-center gap-1 text-[11px] font-semibold',
                  card.accent,
                  'opacity-70 transition group-hover:opacity-100'
                )}
              >
                ดูรายละเอียด
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          )
        })}
      </div>

      <Dialog
        open={detailTheme != null}
        onOpenChange={(open) => {
          if (!open) setDetailTheme(null)
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {activeDef && ActiveIcon ? (
            <>
              <DialogHeader className={cn('border-b px-6 py-5', activeDef.accentSoft)}>
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-xl',
                      activeDef.iconBg
                    )}
                  >
                    <ActiveIcon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="text-left">
                      {activeDef.key === 'other'
                        ? activeDef.title
                        : `${activeDef.index}.${activeDef.title}`}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-left text-[13px] leading-relaxed">
                      {activeDef.description}
                    </DialogDescription>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
                    {(activeDef.key === 'other'
                      ? otherCount
                      : (counts[activeDef.key as number] ?? 0)
                    ).toLocaleString('th-TH')}{' '}
                    รายการ
                  </span>
                  {selectedTheme === activeDef.key ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => onSelectTheme('all')}
                    >
                      แสดงทุกด้านในตาราง
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => onSelectTheme(activeDef.key)}
                    >
                      กรองตารางหลักตามด้านนี้
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <div className="border-b border-slate-100 px-6 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={detailQuery}
                    onChange={(e) => setDetailQuery(e.target.value)}
                    placeholder="ค้นหาในด้านนี้..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
                {detailComments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-12 text-center">
                    <p className="text-sm font-medium text-slate-500">ยังไม่มีรายละเอียดในด้านนี้</p>
                    <p className="mt-1 text-xs text-slate-400">
                      เมื่อมีความคิดเห็นที่จัดอยู่ในด้านนี้ จะแสดงรายการที่นี่
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {detailComments.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm"
                      >
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {c.department}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold',
                              c.sentiment === 'positive' && 'bg-emerald-50 text-emerald-700',
                              c.sentiment === 'neutral' && 'bg-slate-100 text-slate-600',
                              c.sentiment === 'negative' && 'bg-rose-50 text-rose-700'
                            )}
                          >
                            {sentimentLabel(c.sentiment)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-800">{c.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function filterCommentsByPart3Theme(
  comments: PeComment[],
  theme: PePart3ThemeFilter
): PeComment[] {
  return comments.filter((c) => commentMatchesTheme(c, theme))
}
