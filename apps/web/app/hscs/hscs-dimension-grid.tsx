import { cn } from '@/app/common/utils'
import {
  formatScore,
  getScoreBand,
  HSCS_BAND_LABELS,
  HSCS_BAND_STYLES,
  HSCS_SYMBOL_LEGEND,
} from '@/app/hscs/hscs-scoring'
import type { HscsDimension } from '@/app/hscs/hscs-types'

type HscsDimensionGridProps = {
  dimensions: HscsDimension[]
  title?: string
}

export function HscsDimensionGrid({
  dimensions,
  title = 'ร้อยละคำตอบเชิงบวก (% Positive Response) จำแนกตามมิติ',
}: HscsDimensionGridProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-heading text-base font-bold text-slate-900 lg:text-lg">{title}</h3>
        <p className="text-xs text-slate-500">แสดงผลตามเกณฑ์สีมาตรฐาน HSCS</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {dimensions.map((dimension) => (
          <DimensionCard key={dimension.id} dimension={dimension} />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <p className="font-heading text-sm font-bold text-slate-900">สัญลักษณ์และความหมาย</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {HSCS_SYMBOL_LEGEND.map((item) => (
            <li key={item.band} className="flex items-center gap-2.5">
              <span
                className="size-4 shrink-0 rounded-sm border border-black/10 shadow-sm"
                style={{ backgroundColor: item.swatch }}
                aria-hidden
              />
              <span className="text-sm font-semibold" style={{ color: item.swatch }}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-[12px] leading-relaxed text-slate-600">
          หมายเหตุ: ตัวอักษรและตัวเลขจะตรงกับ Section และข้อในแบบสำรวจ
        </p>
      </div>
    </section>
  )
}

function DimensionCard({ dimension }: { dimension: HscsDimension }) {
  const band = getScoreBand(dimension.score)
  const styles = HSCS_BAND_STYLES[band]

  return (
    <article
      className={cn(
        'flex min-h-[11.5rem] flex-col overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md',
        styles.bg,
        styles.border,
        styles.text
      )}
    >
      <div className="px-3 py-2.5">
        <p className="text-[11px] font-bold leading-snug opacity-95">
          {dimension.number}. {dimension.title}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-3 py-2">
        <p className="font-heading text-3xl font-bold tracking-tight">
          {formatScore(dimension.score)}
        </p>
        <p className="mt-1 text-[11px] font-semibold opacity-90">{HSCS_BAND_LABELS[band]}</p>
      </div>

      <div className="flex flex-wrap gap-1 border-t border-black/10 bg-black/5 p-2">
        {dimension.subItems.map((sub) => {
          const subBand = getScoreBand(sub.score)
          const subStyles = HSCS_BAND_STYLES[subBand]
          return (
            <span
              key={sub.code}
              title={`${sub.code}: ${formatScore(sub.score)}`}
              className={cn(
                'inline-flex min-w-[3.5rem] flex-col items-center justify-center rounded px-1.5 py-1 leading-tight shadow-sm',
                subStyles.subBg,
                subStyles.subText
              )}
            >
              <span className="text-[10px] font-bold">{sub.code}</span>
              <span className="text-[9px] font-semibold tabular-nums opacity-95">
                {formatScore(sub.score)}
              </span>
            </span>
          )
        })}
      </div>
    </article>
  )
}
