import { cn } from '@/app/common/utils'
import { CQI_STEP_META, type CqiDevelopmentStep } from '@/app/service-profile/worksheet-types'

const hintListClass = 'space-y-1.5 text-[11px] leading-relaxed'
const hintItemClass = 'flex gap-1.5 break-words [overflow-wrap:anywhere]'

export function CqiDevelopmentPlanStepsGrid({
  steps,
  onChange,
  readOnly = false,
}: {
  steps: CqiDevelopmentStep[]
  onChange?: (next: CqiDevelopmentStep[]) => void
  readOnly?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {CQI_STEP_META.map((step, i) => (
        <div
          key={step.title}
          className={cn(
            'flex min-h-[17rem] flex-col overflow-hidden rounded-lg border shadow-sm',
            step.color
          )}
        >
          <div className="shrink-0 border-b border-black/10 px-3 py-2.5">
            <p className="text-xs font-bold leading-snug">{step.title}</p>
          </div>

          <ul className={cn('shrink-0 border-b border-black/10 px-3 py-2.5', hintListClass)}>
            {step.hints.map((hint) => (
              <li key={hint} className={hintItemClass}>
                <span className="shrink-0 text-black/50">•</span>
                <span className="min-w-0">{hint}</span>
              </li>
            ))}
          </ul>

          <div className="flex min-h-0 flex-1 flex-col p-2">
            {readOnly ? (
              <p className="min-h-[5.5rem] flex-1 whitespace-pre-wrap break-words px-1 py-1 text-xs leading-relaxed [overflow-wrap:anywhere]">
                {steps[i]?.content?.trim() || '—'}
              </p>
            ) : (
              <textarea
                value={steps[i]?.content ?? ''}
                onChange={(e) => {
                  if (!onChange) return
                  const next = [...steps]
                  next[i] = { content: e.target.value }
                  onChange(next)
                }}
                rows={5}
                className="min-h-[5.5rem] w-full flex-1 resize-y rounded-md border border-black/10 bg-white/80 px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                placeholder="กรอกรายละเอียด..."
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
