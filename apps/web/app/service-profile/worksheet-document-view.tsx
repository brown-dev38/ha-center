'use client'

import { cn } from '@/app/common/utils'
import { HaLogo } from '@/app/brand/ha-logo'
import { CqiDevelopmentPlanStepsGrid } from '@/app/service-profile/cqi-development-plan-steps'
import { DaliFrameworkDiagram } from '@/app/service-profile/dali-framework-diagram'
import {
  hasKpiDashboardData,
  KpiResultsDashboard,
} from '@/app/service-profile/kpi-results-dashboard'
import {
  buildRiskAssessmentSummary,
  createEmptyDaliFramework,
  resolveCqiPlans,
  resolveRiskAssessments,
  RISK_LEVEL_CLASS,
  riskLevel,
  riskScore,
  MISSION_ALIGNMENT_FIXED_ITEMS,
  STRATEGY_MED_UP_FIXED_ITEMS,
  VISION_FACULTY_FOCUS_ITEMS,
  type UnitProfileWorksheet,
} from '@/app/service-profile/worksheet-types'

const LIKELIHOOD = [5, 4, 3, 2, 1] as const
const CONSEQUENCE = [1, 2, 3, 4, 5] as const

function DocSection({ title, variant = 'blue', children }: { title: string; variant?: 'blue' | 'rose'; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <div
        className={cn(
          'mb-2 rounded px-3 py-1.5 text-xs font-bold text-white print:rounded-none',
          variant === 'blue' ? 'bg-[#1e5a9e] print:bg-[#1e5a9e]' : 'bg-rose-600 print:bg-rose-600'
        )}
      >
        {title}
      </div>
      {children}
    </section>
  )
}

function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 border-b border-border/50 py-1.5 text-xs">
      <span className="font-semibold text-foreground/80">{label}</span>
      <span className="whitespace-pre-wrap text-foreground">{value || '—'}</span>
    </div>
  )
}

function FieldHighlightLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 border-b border-border/50 py-1.5 text-xs">
      <span className="font-semibold text-foreground/80">{label}</span>
      <div className="whitespace-pre-wrap rounded-lg border border-amber-800/35 bg-[#fff5ee] px-3 py-2 text-[11px] leading-relaxed text-foreground">
        {value || '—'}
      </div>
    </div>
  )
}

function NumberedItems({
  label,
  items,
  numbered = true,
}: {
  label: string
  items: string[]
  numbered?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground/80">{label}</p>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 text-xs">
          {numbered && <span className="w-5 shrink-0 text-muted-foreground">{i + 1})</span>}
          <span className="whitespace-pre-wrap">{item || '—'}</span>
        </div>
      ))}
    </div>
  )
}

function RiskMatrixReadonly({ cells }: { cells: UnitProfileWorksheet['riskCells'] }) {
  const selected = new Set(cells.map((c) => `${c.likelihood}-${c.consequence}`))
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="border p-1" />
            {CONSEQUENCE.map((c) => (
              <th key={c} className="border p-1 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LIKELIHOOD.map((l) => (
            <tr key={l}>
              <td className="border p-1 font-semibold">{l}</td>
              {CONSEQUENCE.map((c) => {
                const score = riskScore(l, c)
                const level = riskLevel(score)
                const active = selected.has(`${l}-${c}`)
                return (
                  <td
                    key={c}
                    className={cn(
                      'border p-1 text-center font-semibold',
                      RISK_LEVEL_CLASS[level],
                      active && 'ring-2 ring-inset ring-primary'
                    )}
                  >
                    {score}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {cells.length > 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          ความเสี่ยงที่เลือก: {cells.map((c) => `L${c.likelihood}×C${c.consequence}=${riskScore(c.likelihood, c.consequence)}`).join(', ')}
        </p>
      )}
    </div>
  )
}

function CqiYearReadonly({ year, rows }: { year: string; rows: { topic: string; result: string }[] }) {
  return (
    <div>
      <p className="mb-1 text-center text-xs font-bold text-primary">{year}</p>
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="w-6 border p-1" />
            <th className="border p-1 text-left">Topic</th>
            <th className="border p-1 text-left">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border p-1 text-center">{i + 1})</td>
              <td className="border p-1 whitespace-pre-wrap">{row.topic || '—'}</td>
              <td className="border p-1 whitespace-pre-wrap">{row.result || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type WorksheetDocumentViewProps = {
  data: UnitProfileWorksheet
  id?: string
  className?: string
}

export function WorksheetDocumentView({ data, id = 'worksheet-document', className }: WorksheetDocumentViewProps) {
  const displayDate = data.date
    ? new Date(data.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
    : '—'
  const riskAssessments = resolveRiskAssessments(data)

  return (
    <article
      id={id}
      className={cn(
        'mx-auto max-w-5xl bg-white p-6 text-foreground shadow-sm print:max-w-none print:p-4 print:shadow-none',
        className
      )}
    >
      <header className="mb-6 flex flex-col gap-4 border-b-2 border-[#1e5a9e]/30 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <HaLogo size="md" framed />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-[#1e5a9e]"> Unit Profile</h1>
            <p className="text-sm font-semibold text-[#1e5a9e]/80"></p>
          </div>
        </div>
        <div className="space-y-1 text-xs sm:text-right">
          <p>
            <span className="font-semibold">Date :</span> {displayDate}
          </p>
          <p>
            <span className="font-semibold">Unit :</span> {data.unitHeader || '—'}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <DocSection title="1. Unit Information (ข้อมูลพื้นฐานหน่วยงาน)">
            <div className="rounded border border-border/60 p-2">
              <FieldLine label="Unit :" value={data.unit} />
              <FieldLine label="Vision - Faculty :" value={data.visionFaculty} />
              <FieldHighlightLine label="Vision - Hospital :" value={data.visionHospital} />
              <div className="my-2 rounded-lg border border-amber-800/35 bg-[#fff5ee] px-3 py-2 text-[11px]">
                <p className="font-bold text-primary">เข็มมุ่ง (Focus area)</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                  {VISION_FACULTY_FOCUS_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <FieldHighlightLine label="Core Value :" value={data.coreValue} />
            </div>
          </DocSection>

          <DocSection title="2. Mission (พันธกิจ)">
            <div className="grid gap-4 rounded border border-border/60 p-3 md:grid-cols-2">
              <NumberedItems label="Mission (in Alignment with Organization)" items={[...MISSION_ALIGNMENT_FIXED_ITEMS]} />
              <NumberedItems label="Mission (of Unit)" items={data.missionOfUnit} />
            </div>
          </DocSection>

          <DocSection title="5. CQI in Progress (งานพัฒนาคุณภาพที่กำลังดำเนินการ)">
            <div className="grid gap-3 rounded border border-border/60 p-3 sm:grid-cols-3">
              <CqiYearReadonly year="2023" rows={data.cqiInProgress.y2023} />
              <CqiYearReadonly year="2024" rows={data.cqiInProgress.y2024} />
              <CqiYearReadonly year="2025" rows={data.cqiInProgress.y2025} />
            </div>
          </DocSection>

          <p className="rounded border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-950">
            <span className="font-semibold">Note :</span> Risk Matrix is used to prioritize key risks and supports CQI
            planning and unit risk management.
          </p>
        </div>

        <div className="space-y-5">
          <DocSection title="3. Risk Matrix (ตารางประเมินความเสี่ยง)">
            <div className="space-y-4">
              {riskAssessments.map((assessment, index) => (
                <div key={assessment.id} className="rounded border border-border/60 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-border/50 pb-2">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-xs font-bold text-foreground">
                      {assessment.topic.trim() || `หัวข้อที่ ${index + 1}`}
                    </p>
                  </div>
                  <FieldLine label="หัวข้อประเมิน :" value={assessment.topic} />
                  <FieldHighlightLine
                    label="สรุปค่าประเมิน :"
                    value={buildRiskAssessmentSummary(assessment.cells)}
                  />
                  <RiskMatrixReadonly cells={assessment.cells} />
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection title="4. Strategy (กลยุทธ์)">
            <div className="grid gap-4 rounded border border-border/60 p-3 md:grid-cols-2">
              <NumberedItems label="Strategy (MED UP)" items={[...STRATEGY_MED_UP_FIXED_ITEMS]} numbered={false} />
              <NumberedItems label="Unit Strategy" items={data.unitStrategy} />
            </div>
          </DocSection>

          <div className="rounded border border-border/60 p-3">
            <NumberedItems label="Best Practice / Key Learnings" items={data.bestPractices} />
            <div className="mt-3 border-t border-border/50 pt-2 text-xs">
              <span className="font-semibold">Prepared by :</span> {data.preparedBy || '—'}
            </div>
          </div>
        </div>

        <div className="break-inside-avoid lg:col-span-2">
          <DaliFrameworkDiagram value={data.daliFramework ?? createEmptyDaliFramework()} readOnly />
        </div>

        <div className="space-y-5 lg:col-span-2">
          <DocSection title="6. CQI Development Plan (แผนการทำโครงการพัฒนาคุณภาพ)" variant="rose">
            <div className="space-y-4">
              {resolveCqiPlans(data).map((plan, index) => (
                <div key={plan.id} className="space-y-3 rounded border border-rose-200/70 bg-rose-50/30 p-3">
                  <div className="flex flex-wrap items-center gap-2 border-b border-rose-100 pb-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold text-rose-950">
                      {plan.title.trim() || `โครงการที่ ${index + 1}`}
                      {plan.year.trim() ? (
                        <span className="ml-2 font-semibold text-rose-700">— Year {plan.year}</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <FieldLine label="CQI Title (ชื่อเรื่อง CQI) :" value={plan.title} />
                    <FieldLine label="Owner/Responsible (ผู้รับผิดชอบ) :" value={plan.owner} />
                    <FieldLine label="Objective (วัตถุประสงค์) :" value={plan.objective} />
                    <FieldLine label="Timeline (ระยะเวลา) :" value={plan.timeline} />
                  </div>
                  <CqiDevelopmentPlanStepsGrid steps={plan.steps} readOnly />
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection title="7. KPI / Key Results / Best Practice (ตัวชี้วัด / ผลลัพธ์ / แนวปฏิบัติที่เป็นเลิศ)">
            <div className="grid gap-4 rounded border border-border/60 p-3 md:grid-cols-2">
              <NumberedItems label="KPI / Key Success Indicators" items={data.kpiIndicators} />
              <NumberedItems label="Results/Target" items={data.kpiResults} />
            </div>
            {hasKpiDashboardData({
              kpiIndicators: data.kpiIndicators,
              kpiResults: data.kpiResults,
              bestPractices: data.bestPractices,
            }) && (
              <div className="mt-3 break-inside-avoid">
                <KpiResultsDashboard
                  data={{
                    kpiIndicators: data.kpiIndicators,
                    kpiResults: data.kpiResults,
                    bestPractices: data.bestPractices,
                  }}
                />
              </div>
            )}
          </DocSection>
        </div>
      </div>
    </article>
  )
}
