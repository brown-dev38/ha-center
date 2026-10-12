'use client'

import { useEffect, useState } from 'react'
import { CopyPlus, FileStack, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/app/common/utils'
import { CqiDevelopmentPlanStepsGrid } from '@/app/service-profile/cqi-development-plan-steps'
import {
  createEmptyCqiPlan,
  type CqiDevelopmentPlan,
} from '@/app/service-profile/worksheet-types'

type CqiDevelopmentPlansPanelProps = {
  plans: CqiDevelopmentPlan[]
  onChange: (plans: CqiDevelopmentPlan[]) => void
  readOnly?: boolean
}

function planLabel(plan: CqiDevelopmentPlan, index: number) {
  const title = plan.title.trim()
  if (title) return title
  return `โครงการที่ ${index + 1}`
}

function planFilledCount(plan: CqiDevelopmentPlan) {
  const fields = [plan.year, plan.title, plan.owner, plan.objective, plan.timeline]
  const fieldFilled = fields.filter((v) => v.trim()).length
  const stepFilled = plan.steps.filter((s) => s.content.trim()).length
  return { fieldFilled, stepFilled, total: 5 + 5 }
}

export function CqiDevelopmentPlansPanel({
  plans,
  onChange,
  readOnly = false,
}: CqiDevelopmentPlansPanelProps) {
  const safePlans = plans.length > 0 ? plans : [createEmptyCqiPlan()]
  const [activeId, setActiveId] = useState(safePlans[0]?.id)

  useEffect(() => {
    if (!safePlans.some((p) => p.id === activeId)) {
      setActiveId(safePlans[0]?.id)
    }
  }, [safePlans, activeId])

  const activeIndex = Math.max(
    0,
    safePlans.findIndex((p) => p.id === activeId)
  )
  const active = safePlans[activeIndex] ?? safePlans[0]

  const updatePlan = (id: string, patch: Partial<CqiDevelopmentPlan>) => {
    onChange(safePlans.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const addPlan = () => {
    const next = createEmptyCqiPlan({
      year: active?.year || new Date().getFullYear().toString(),
    })
    onChange([...safePlans, next])
    setActiveId(next.id)
  }

  const duplicatePlan = () => {
    if (!active) return
    const next = createEmptyCqiPlan({
      ...active,
      id: undefined,
      title: active.title ? `${active.title} (สำเนา)` : '',
    })
    onChange([...safePlans, next])
    setActiveId(next.id)
  }

  const removePlan = (id: string) => {
    if (safePlans.length <= 1) return
    const next = safePlans.filter((p) => p.id !== id)
    onChange(next)
    if (activeId === id) setActiveId(next[0]?.id)
  }

  if (!active) return null

  const progress = planFilledCount(active)
  const completeness = Math.round(((progress.fieldFilled + progress.stepFilled) / progress.total) * 100)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 via-white to-orange-50/40 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-rose-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
              <FileStack className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-950">โครงการพัฒนาคุณภาพ (CQI Projects)</p>
              <p className="mt-0.5 text-xs text-rose-800/70">
                เพิ่มได้หลายโครงการ — สลับแท็บเพื่อกรอกแผนละเรื่อง
              </p>
            </div>
          </div>
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-rose-200 bg-white text-rose-800 hover:bg-rose-50"
                onClick={duplicatePlan}
              >
                <CopyPlus className="size-3.5" />
                สำเนาโครงการ
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 bg-rose-600 text-white hover:bg-rose-700"
                onClick={addPlan}
              >
                <Plus className="size-3.5" />
                เพิ่มโครงการ
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5">
          {safePlans.map((plan, index) => {
            const isActive = plan.id === active.id
            const filled = planFilledCount(plan)
            const hasData = filled.fieldFilled + filled.stepFilled > 0
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setActiveId(plan.id)}
                className={cn(
                  'group relative inline-flex min-w-[9.5rem] max-w-[14rem] shrink-0 flex-col rounded-xl border px-3 py-2 text-left transition',
                  isActive
                    ? 'border-rose-400 bg-white shadow-md ring-2 ring-rose-200/80'
                    : 'border-rose-100/80 bg-white/60 hover:border-rose-200 hover:bg-white'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                      isActive ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground">
                    {planLabel(plan, index)}
                  </span>
                </span>
                <span className="mt-1 truncate text-[10px] text-muted-foreground">
                  {plan.year ? `ปี ${plan.year}` : 'ยังไม่ระบุปี'}
                  {hasData ? ' · มีข้อมูล' : ' · ว่าง'}
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
              โครงการที่ {activeIndex + 1}
              {active.title.trim() ? (
                <span className="font-semibold text-rose-700"> — {active.title.trim()}</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              กรอกรายละเอียดโครงการและขั้นตอน Content → Concept → Criteria → Purpose/Design → Action
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-[7.5rem]">
              <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span>ความครบถ้วน</span>
                <span className="tabular-nums text-rose-700">{completeness}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            {!readOnly && safePlans.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => removePlan(active.id)}
              >
                <Trash2 className="size-3.5" />
                ลบ
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {(
            [
              ['Year (ปี)', 'year', 'เช่น 2025'],
              ['CQI Title (ชื่อเรื่อง)', 'title', 'ชื่อโครงการ'],
              ['Owner/Responsible', 'owner', 'ผู้รับผิดชอบ'],
              ['Objective (วัตถุประสงค์)', 'objective', 'วัตถุประสงค์'],
              ['Timeline (ระยะเวลา)', 'timeline', 'เช่น ม.ค.–มิ.ย. 2025'],
            ] as const
          ).map(([label, key, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">{label}</Label>
              {readOnly ? (
                <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                  {active[key]?.trim() || '—'}
                </p>
              ) : (
                <Input
                  value={active[key]}
                  onChange={(e) => updatePlan(active.id, { [key]: e.target.value })}
                  placeholder={placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <CqiDevelopmentPlanStepsGrid
          steps={active.steps}
          readOnly={readOnly}
          onChange={
            readOnly
              ? undefined
              : (steps) => updatePlan(active.id, { steps })
          }
        />
      </div>

      {!readOnly && (
        <p className="text-center text-[11px] text-muted-foreground">
          มีทั้งหมด <span className="font-semibold text-foreground">{safePlans.length}</span> โครงการ
          — กด &quot;เพิ่มโครงการ&quot; เพื่อสร้างแผน CQI เรื่องใหม่
        </p>
      )}
    </div>
  )
}
