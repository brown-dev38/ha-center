'use client'

import { useEffect, useState } from 'react'
import { CopyPlus, Lightbulb, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/app/common/utils'
import { RiskMatrixGrid } from '@/app/service-profile/risk-matrix-grid'
import {
  RISK_LEVEL_CLASS,
  buildRiskAssessmentSummary,
  createEmptyRiskAssessment,
  riskLevel,
  riskScore,
  type RiskAssessment,
  type RiskMatrixCell,
} from '@/app/service-profile/worksheet-types'

type RiskAssessmentsPanelProps = {
  assessments: RiskAssessment[]
  onChange: (assessments: RiskAssessment[]) => void
  readOnly?: boolean
}

function assessmentLabel(item: RiskAssessment, index: number) {
  const topic = item.topic.trim()
  if (topic) return topic
  return `หัวข้อที่ ${index + 1}`
}

function worstLevel(item: RiskAssessment) {
  if (!item.cells.length) return null
  const scores = item.cells.map((c) => riskScore(c.likelihood, c.consequence))
  const max = Math.max(...scores)
  return riskLevel(max)
}

const LEVEL_TH: Record<NonNullable<ReturnType<typeof worstLevel>>, string> = {
  low: 'ต่ำ',
  moderate: 'ปานกลาง',
  high: 'สูง',
  extreme: 'สูงมาก',
}

export function RiskAssessmentsPanel({
  assessments,
  onChange,
  readOnly = false,
}: RiskAssessmentsPanelProps) {
  const safe = assessments.length > 0 ? assessments : [createEmptyRiskAssessment()]
  const [activeId, setActiveId] = useState(safe[0]?.id)

  useEffect(() => {
    if (!safe.some((a) => a.id === activeId)) {
      setActiveId(safe[0]?.id)
    }
  }, [safe, activeId])

  const activeIndex = Math.max(0, safe.findIndex((a) => a.id === activeId))
  const active = safe[activeIndex] ?? safe[0]

  const updateAssessment = (id: string, patch: Partial<RiskAssessment>) => {
    onChange(safe.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const toggleCell = (id: string, cell: RiskMatrixCell) => {
    const target = safe.find((a) => a.id === id)
    if (!target) return
    const exists = target.cells.some(
      (c) => c.likelihood === cell.likelihood && c.consequence === cell.consequence
    )
    const nextCells = exists
      ? target.cells.filter(
          (c) => !(c.likelihood === cell.likelihood && c.consequence === cell.consequence)
        )
      : [...target.cells, cell]
    updateAssessment(id, { cells: nextCells })
  }

  const addAssessment = () => {
    const next = createEmptyRiskAssessment()
    onChange([...safe, next])
    setActiveId(next.id)
  }

  const duplicateAssessment = () => {
    if (!active) return
    const next = createEmptyRiskAssessment({
      topic: active.topic ? `${active.topic} (สำเนา)` : '',
      cells: active.cells,
    })
    onChange([...safe, next])
    setActiveId(next.id)
  }

  const removeAssessment = (id: string) => {
    if (safe.length <= 1) return
    const next = safe.filter((a) => a.id !== id)
    onChange(next)
    if (activeId === id) setActiveId(next[0]?.id)
  }

  if (!active) return null

  const summary = buildRiskAssessmentSummary(active.cells)
  const activeWorst = worstLevel(active)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">หัวข้อประเมินความเสี่ยง</p>
              <p className="mt-0.5 text-xs text-slate-600">
                เพิ่มได้หลายหัวข้อ — สลับแท็บเพื่อประเมินทีละเรื่อง
              </p>
            </div>
          </div>
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                onClick={duplicateAssessment}
              >
                <CopyPlus className="size-3.5" />
                สำเนาหัวข้อ
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
                onClick={addAssessment}
              >
                <Plus className="size-3.5" />
                เพิ่มหัวข้อ
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5">
          {safe.map((item, index) => {
            const isActive = item.id === active.id
            const worst = worstLevel(item)
            const hasData = Boolean(item.topic.trim() || item.cells.length)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'group relative inline-flex min-w-[10rem] max-w-[15rem] shrink-0 flex-col rounded-xl border px-3 py-2 text-left transition',
                  isActive
                    ? 'border-slate-400 bg-white shadow-md ring-2 ring-slate-200/80'
                    : 'border-slate-100/90 bg-white/60 hover:border-slate-200 hover:bg-white'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                      isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground">
                    {assessmentLabel(item, index)}
                  </span>
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {hasData ? (
                    worst ? (
                      <span
                        className={cn(
                          'inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold capitalize',
                          RISK_LEVEL_CLASS[worst]
                        )}
                      >
                        {LEVEL_TH[worst]}
                      </span>
                    ) : (
                      <span>มีชื่อหัวข้อ</span>
                    )
                  ) : (
                    <span>ว่าง</span>
                  )}
                  {item.cells.length > 0 && (
                    <span className="tabular-nums">· {item.cells.length} ช่อง</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">
              หัวข้อที่ {activeIndex + 1}
              {active.topic.trim() ? (
                <span className="font-semibold text-slate-700"> — {active.topic.trim()}</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ระบุหัวข้อแล้วคลิกช่องในตาราง ความเสี่ยง = Likelihood × Consequence
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeWorst && (
              <span
                className={cn(
                  'inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold capitalize',
                  RISK_LEVEL_CLASS[activeWorst]
                )}
              >
                สูงสุด: {LEVEL_TH[activeWorst]}
              </span>
            )}
            {!readOnly && safe.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => removeAssessment(active.id)}
              >
                <Trash2 className="size-3.5" />
                ลบ
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">
            หัวข้อประเมินความเสี่ยง
          </Label>
          {readOnly ? (
            <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
              {active.topic.trim() || '—'}
            </p>
          ) : (
            <Input
              value={active.topic}
              onChange={(e) => updateAssessment(active.id, { topic: e.target.value })}
              placeholder="เช่น การติดเชื้อในโรงพยาบาล / ความคลาดเคลื่อนทางยา"
            />
          )}
        </div>

        {readOnly ? (
          <RiskMatrixGrid selected={active.cells} readOnly />
        ) : (
          <RiskMatrixGrid
            selected={active.cells}
            onSelect={(cell) => toggleCell(active.id, cell)}
          />
        )}

        <div className="mt-4 space-y-1.5">
          <Label className="text-xs font-semibold text-foreground/80">สรุปค่าประเมิน</Label>
          <div className="rounded-lg border border-amber-800/35 bg-[#fff5ee] px-3 py-2.5 text-sm leading-relaxed text-foreground">
            {summary}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-sky-600" />
        <p>
          <span className="font-semibold">Note :</span> Risk Matrix is used to prioritize key risks
          and supports CQI planning and unit risk management.
          {!readOnly && (
            <>
              {' '}
              มีทั้งหมด <span className="font-semibold">{safe.length}</span> หัวข้อ — กด
              &quot;เพิ่มหัวข้อ&quot; เพื่อประเมินเรื่องใหม่
            </>
          )}
        </p>
      </div>
    </div>
  )
}
