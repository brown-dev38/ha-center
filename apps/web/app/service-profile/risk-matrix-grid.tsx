'use client'

import { cn } from '@/app/common/utils'
import {
  RISK_LEVEL_CLASS,
  riskLevel,
  riskScore,
  type RiskMatrixCell,
} from '@/app/service-profile/worksheet-types'

const LIKELIHOOD_LABELS = [
  { value: 5, label: 'Almost certain' },
  { value: 4, label: 'Likely' },
  { value: 3, label: 'Possible' },
  { value: 2, label: 'Unlikely' },
  { value: 1, label: 'Rare' },
] as const

const CONSEQUENCE_LABELS = [
  { value: 1, label: 'Negligible' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Major' },
  { value: 5, label: 'Catastrophic' },
] as const

type RiskMatrixGridProps = {
  selected: RiskMatrixCell[]
  onSelect?: (cell: RiskMatrixCell) => void
  readOnly?: boolean
}

export function RiskMatrixGrid({ selected, onSelect, readOnly = false }: RiskMatrixGridProps) {
  const isSelected = (likelihood: number, consequence: number) =>
    selected.some((c) => c.likelihood === likelihood && c.consequence === consequence)

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Consequence (Impact)
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[auto_repeat(5,minmax(4.5rem,1fr))] gap-1">
            <div />
            {CONSEQUENCE_LABELS.map((c) => (
              <div key={c.value} className="px-1 text-center text-[10px] font-medium leading-tight text-muted-foreground">
                <div>{c.value}</div>
                <div className="mt-0.5">{c.label}</div>
              </div>
            ))}

            {LIKELIHOOD_LABELS.map((l) => (
              <div key={l.value} className="contents">
                <div className="flex items-center pr-2 text-[10px] font-medium leading-tight text-muted-foreground">
                  <div>
                    <div>{l.value}</div>
                    <div className="mt-0.5 max-w-[4.5rem]">{l.label}</div>
                  </div>
                </div>
                {CONSEQUENCE_LABELS.map((c) => {
                  const score = riskScore(l.value, c.value)
                  const level = riskLevel(score)
                  const active = isSelected(l.value, c.value)
                  return (
                    <button
                      key={`${l.value}-${c.value}`}
                      type="button"
                      disabled={readOnly}
                      onClick={() => onSelect?.({ likelihood: l.value, consequence: c.value })}
                      className={cn(
                        'rounded-md border px-1 py-2 text-center text-[10px] font-semibold transition',
                        RISK_LEVEL_CLASS[level],
                        active && 'ring-2 ring-primary ring-offset-1',
                        readOnly ? 'cursor-default opacity-95' : 'hover:ring-2 hover:ring-primary/40'
                      )}
                      title={`Likelihood ${l.value} × Consequence ${c.value} = ${score}`}
                    >
                      <div className="capitalize">{level}</div>
                      <div className="mt-0.5 text-[11px]">{score}</div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Likelihood (Probability) ↑ — คลิกช่องเพื่อเลือกความเสี่ยง (เลือกได้หลายช่อง)
      </p>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded border border-emerald-400 bg-emerald-200 px-2 py-0.5">Low 1–3</span>
        <span className="rounded border border-yellow-400 bg-yellow-200 px-2 py-0.5">Moderate 4–6</span>
        <span className="rounded border border-orange-500 bg-orange-300 px-2 py-0.5">High 7–12</span>
        <span className="rounded border border-red-600 bg-red-400 px-2 py-0.5">Extreme 13–25</span>
      </div>
    </div>
  )
}
