'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_SERIES } from '@/app/charts/chart-theme'
import type { PeDemographics, PePart3ThemeStat } from '@/app/patient-experience/pe-types'
import { cn } from '@/app/common/utils'

type PeSurveyStructurePanelsProps = {
  demographics?: PeDemographics
  part3Themes: PePart3ThemeStat[]
  part1Note?: string
}

type DemoBucket = { label: string; count: number }

const DEMO_CARDS: {
  key: keyof PeDemographics
  title: string
  questionNo: string
}[] = [
  { key: 'visitFrequency', title: 'ความถี่การใช้บริการ', questionNo: '01' },
  { key: 'gender', title: 'เพศ', questionNo: '02' },
  { key: 'age', title: 'อายุ', questionNo: '03' },
  { key: 'education', title: 'การศึกษา', questionNo: '04' },
  { key: 'rights', title: 'สิทธิการรักษา', questionNo: '05' },
]

function DemoPieCard({
  title,
  questionNo,
  buckets,
}: {
  title: string
  questionNo: string
  buckets: DemoBucket[]
}) {
  const total = buckets.reduce((s, b) => s + b.count, 0)
  const data = buckets
    .filter((b) => b.count > 0)
    .map((b) => ({
      name: b.label,
      value: b.count,
      pct: total > 0 ? Math.round((b.count / total) * 1000) / 10 : 0,
    }))

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {questionNo}
          </p>
          <h4 className="mt-0.5 truncate text-sm font-semibold text-slate-900">{title}</h4>
        </div>
        {total > 0 ? (
          <p className="shrink-0 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium tabular-nums text-slate-500">
            n = {total.toLocaleString('th-TH')}
          </p>
        ) : null}
      </header>

      {!data.length ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center">
          <div className="mb-3 size-16 rounded-full border-4 border-dashed border-slate-200" aria-hidden />
          <p className="text-sm font-medium text-slate-500">ยังไม่มีข้อมูล</p>
          <p className="mt-1 text-xs text-slate-400">รออัปโหลดหรือระบุในไฟล์สำรวจ</p>
        </div>
      ) : (
        <>
          <div className="mx-auto h-[168px] w-full max-w-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_SERIES[i % CHART_SERIES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, item) => {
                    const pct = (item?.payload as { pct?: number } | undefined)?.pct
                    return [`${Number(value).toLocaleString('th-TH')} คน (${pct ?? 0}%)`, 'จำนวน']
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-3 flex-1 space-y-1.5 border-t border-slate-100 pt-3">
            {data.map((d, i) => (
              <li
                key={d.name}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_3.25rem] items-center gap-x-2 text-[12px] leading-snug"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_SERIES[i % CHART_SERIES.length] }}
                  aria-hidden
                />
                <span className="min-w-0 text-slate-600">{d.name}</span>
                <span className="tabular-nums text-slate-500">
                  {d.value.toLocaleString('th-TH')}
                </span>
                <span className="text-right font-semibold tabular-nums text-slate-900">
                  {d.pct}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}

export function PeSurveyStructurePanels({
  demographics,
  part3Themes,
  part1Note,
}: PeSurveyStructurePanelsProps) {
  const demoTotal = demographics
    ? Math.max(
        ...DEMO_CARDS.map((c) =>
          demographics[c.key].reduce((s, b) => s + b.count, 0)
        ),
        0
      )
    : 0

  return (
    <div className="space-y-4">
      {demographics ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 shadow-sm lg:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900">
                ส่วนที่ 1 ข้อมูลของผู้ตอบแบบสอบถาม
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                สัดส่วนผู้ตอบแบบสอบถามตามความถี่ เพศ อายุ การศึกษา และสิทธิการรักษา
              </p>
            </div>
            {demoTotal > 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium tabular-nums text-slate-600">
                ผู้ตอบทั้งหมด{' '}
                <span className="font-bold text-slate-900">
                  {demoTotal.toLocaleString('th-TH')}
                </span>{' '}
                คน
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {DEMO_CARDS.map((card) => (
              <DemoPieCard
                key={card.key}
                title={card.title}
                questionNo={card.questionNo}
                buckets={demographics[card.key]}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <h3 className="font-heading text-base font-bold text-slate-900">
            ส่วนที่ 1 ข้อมูลของผู้ตอบแบบสอบถาม
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {part1Note ??
              'อัปโหลดไฟล์ที่มีคอลัมน์ส่วนที่ 1 เพื่อแสดงสรุปความถี่ เพศ อายุ การศึกษา และสิทธิการรักษา'}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <h3 className="font-heading text-base font-bold text-slate-900">ส่วนที่ 3 ข้อเสนอแนะ</h3>
        <p className="mt-1 text-sm text-slate-500">
          สัดส่วนความคิดเห็นตาม 5 ด้าน + อื่น ๆ (ร้อยละรวม 100)
        </p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {part3Themes.map((t) => (
            <li
              key={`${t.themeIndex}-${t.shortLabel}`}
              className={cn(
                'rounded-xl border px-3 py-2.5',
                t.count > 0
                  ? 'border-violet-200 bg-violet-50/60'
                  : 'border-slate-100 bg-slate-50/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-slate-400">
                    {t.themeIndex >= 0
                      ? `${t.themeIndex + 1}.${t.shortLabel}`
                      : 'อื่น ๆ'}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-800">{t.label}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold tabular-nums text-slate-900">{t.count}</p>
                  <p className="text-[10px] font-semibold text-[#6d28d9]">{t.pct}%</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-[#6d28d9]"
                  style={{ width: `${Math.min(100, t.pct)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
