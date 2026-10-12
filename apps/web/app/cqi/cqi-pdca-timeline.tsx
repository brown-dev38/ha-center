'use client'

import { CheckCircle2, CircleDashed } from 'lucide-react'
import { CQI_PDCA_PHASES, splitCqiParagraphs, type CqiDetail } from '@/app/cqi/cqi'
import { cn } from '@/app/common/utils'

export function CqiPdcaTimeline({ project }: { project: CqiDetail }) {
  const pdca = project.pdca

  return (
    <div className="space-y-6">
      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-3">
        {CQI_PDCA_PHASES.map((phase, index) => {
          const content = pdca[phase.field]
          const hasContent = Boolean(content?.trim())
          const paragraphs = splitCqiParagraphs(content)
          return (
            <div
              key={phase.key}
              className={cn(
                'relative flex flex-col overflow-hidden rounded-2xl border bg-white',
                phase.border,
                hasContent ? 'shadow-sm' : 'opacity-75'
              )}
            >
              <div className={cn('bg-gradient-to-br px-4 py-4', phase.accent)}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-xs font-bold text-white',
                      phase.dot
                    )}
                  >
                    {phase.step}
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {phase.label}
                    </p>
                    <p className="font-bold text-foreground">{phase.labelTh}</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{phase.subtitle}</p>
              </div>
              <div className="flex-1 p-4">
                {paragraphs.length > 0 ? (
                  <div className="cqi-prose-block space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground/70">ยังไม่มีข้อมูล</p>
                )}
              </div>
              {index < CQI_PDCA_PHASES.length - 1 && (
                <div className="absolute -right-2 top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full border-2 border-white bg-primary lg:block" />
              )}
            </div>
          )
        })}
      </div>

      <div className="space-y-4 lg:hidden">
        {CQI_PDCA_PHASES.map((phase) => {
          const content = pdca[phase.field]
          const hasContent = Boolean(content?.trim())
          const paragraphs = splitCqiParagraphs(content)
          return (
            <div
              key={phase.key}
              className={cn('overflow-hidden rounded-2xl border bg-white', phase.border)}
            >
              <div className={cn('flex items-center gap-3 bg-gradient-to-r px-4 py-3', phase.accent)}>
                {hasContent ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                ) : (
                  <CircleDashed className="size-5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {phase.label} · {phase.labelTh}
                  </p>
                  <p className="text-sm font-medium text-foreground">{phase.subtitle}</p>
                </div>
              </div>
              <div className="px-4 py-4">
                {paragraphs.length > 0 ? (
                  <div className="cqi-prose-block space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">ยังไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
