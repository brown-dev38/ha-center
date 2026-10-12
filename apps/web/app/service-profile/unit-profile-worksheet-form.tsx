'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  Save,
  Send,
  X,
} from 'lucide-react'
import { HaLogo } from '@/app/brand/ha-logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { RiskAssessmentsPanel } from '@/app/service-profile/risk-assessments-panel'
import { CqiDevelopmentPlansPanel } from '@/app/service-profile/cqi-development-plans-panel'
import { DaliFrameworkDiagram } from '@/app/service-profile/dali-framework-diagram'
import {
  hasKpiDashboardData,
  KpiResultsDashboard,
} from '@/app/service-profile/kpi-results-dashboard'
import { useSaveWorksheet, useSubmitWorksheet, useWorksheet } from '@/hooks/use-worksheets'
import {
  WORKSHEET_STORAGE_KEY,
  createEmptyWorksheet,
  normalizeWorksheet,
  VISION_HOSPITAL,
  CORE_VALUE,
  VISION_FACULTY_FOCUS_ITEMS,
  MISSION_ALIGNMENT_FIXED_ITEMS,
  STRATEGY_MED_UP_FIXED_ITEMS,
  syncLegacyCqiFields,
  syncLegacyRiskFields,
  isCqiPlansFilled,
  isRiskAssessmentsFilled,
  type UnitProfileWorksheet,
} from '@/app/service-profile/worksheet-types'

function WorksheetHighlightBox({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-amber-800/35 bg-[#fff5ee] px-3 py-2.5 text-sm text-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}

function FacultyFocusAreaBox({ className }: { className?: string }) {
  return (
    <WorksheetHighlightBox className={className}>
      <ul className="list-disc space-y-1 pl-5">
        {VISION_FACULTY_FOCUS_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </WorksheetHighlightBox>
  )
}

function SectionHeader({ children, variant = 'blue' }: { children: React.ReactNode; variant?: 'blue' | 'rose' }) {
  return (
    <div
      className={cn(
        'rounded-md px-3 py-2 text-sm font-bold text-white',
        variant === 'blue' ? 'bg-gradient-to-r from-[#1e5a9e] to-[#2b7bc0]' : 'bg-gradient-to-r from-rose-600 to-rose-500'
      )}
    >
      {children}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[10rem_1fr] sm:items-center">
      <Label className="text-xs font-semibold text-foreground/80">{label}</Label>
      {children}
    </div>
  )
}

function NumberedList({
  label,
  values,
  onChange,
  count = 5,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  count?: number
}) {
  const rowCount = Math.max(values.length, count)

  const setAt = (i: number, val: string) => {
    const next = [...values]
    while (next.length <= i) next.push('')
    next[i] = val
    onChange(next)
  }

  const addItem = () => {
    const next = [...values]
    while (next.length < rowCount) next.push('')
    next.push('')
    onChange(next)
  }

  const removeItem = (i: number) => {
    onChange(values.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-semibold text-foreground/80">{label}</p> : null}
      {Array.from({ length: rowCount }, (_, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 w-5 shrink-0 text-xs font-medium text-muted-foreground">{i + 1})</span>
          <textarea
            value={values[i] ?? ''}
            onChange={(e) => setAt(i, e.target.value)}
            rows={2}
            className="min-h-[2.5rem] w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
          />
          {i >= count ? (
            <button
              type="button"
              onClick={() => removeItem(i)}
              aria-label="ลบรายการ"
              className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
      >
        <Plus className="size-3.5" />
        เพิ่มรายการ
      </button>
    </div>
  )
}

function FixedNumberedList({
  label,
  items,
  numbered = true,
}: {
  label: string
  items: readonly string[]
  numbered?: boolean
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground/80">{label}</p>
      <WorksheetHighlightBox>
        <ol className={cn('space-y-1.5 pl-5 text-sm leading-relaxed', numbered ? 'list-decimal' : 'list-none pl-0')}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </WorksheetHighlightBox>
    </div>
  )
}

function CqiYearTable({
  year,
  rows,
  onChange,
}: {
  year: string
  rows: { topic: string; result: string }[]
  onChange: (rows: { topic: string; result: string }[]) => void
}) {
  const addRow = () => onChange([...rows, { topic: '', result: '' }])
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-bold text-primary">{year}</p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="w-8 border-b border-r px-1 py-1.5" />
              <th className="border-b border-r px-2 py-1.5 text-left font-semibold">Topic</th>
              <th className="border-b px-2 py-1.5 text-left font-semibold">Result</th>
              <th className="w-7 border-b" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-b-0">
                <td className="border-r bg-muted/30 px-1 py-1 text-center font-medium text-muted-foreground">
                  {i + 1})
                </td>
                <td className="border-r p-1">
                  <textarea
                    value={row.topic}
                    onChange={(e) => {
                      const next = [...rows]
                      next[i] = { ...next[i], topic: e.target.value }
                      onChange(next)
                    }}
                    rows={2}
                    className="w-full resize-y rounded border-0 bg-transparent px-1 py-0.5 text-xs outline-none focus:bg-white"
                  />
                </td>
                <td className="p-1">
                  <textarea
                    value={row.result}
                    onChange={(e) => {
                      const next = [...rows]
                      next[i] = { ...next[i], result: e.target.value }
                      onChange(next)
                    }}
                    rows={2}
                    className="w-full resize-y rounded border-0 bg-transparent px-1 py-0.5 text-xs outline-none focus:bg-white"
                  />
                </td>
                <td className="p-0.5 align-top">
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      aria-label="ลบแถว"
                      className="flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10"
      >
        <Plus className="size-3.5" />
        เพิ่มแถว
      </button>
    </div>
  )
}

type StepVariant = 'blue' | 'rose'

type StepDef = {
  key: string
  num: number
  title: string
  titleTh: string
  variant?: StepVariant
}

const STEP_DEFS: StepDef[] = [
  { key: 'unit', num: 1, title: 'Unit Information', titleTh: 'ข้อมูลพื้นฐานหน่วยงาน' },
  { key: 'mission', num: 2, title: 'Mission', titleTh: 'พันธกิจ' },
  { key: 'risk', num: 3, title: 'Risk Matrix', titleTh: 'ตารางประเมินความเสี่ยง' },
  { key: 'strategy', num: 4, title: 'Strategy', titleTh: 'กลยุทธ์' },
  { key: 'cqi', num: 5, title: 'CQI in Progress', titleTh: 'งานพัฒนาคุณภาพ + 3C–DALI' },
  { key: 'plan', num: 6, title: 'CQI Development Plan', titleTh: 'แผนพัฒนาคุณภาพ', variant: 'rose' },
  { key: 'kpi', num: 7, title: 'KPI / Results', titleTh: 'ตัวชี้วัด / ผลลัพธ์ / Best Practice' },
]

const nonEmpty = (s?: string) => Boolean(s && s.trim())
const anyList = (a: string[]) => a.some(nonEmpty)

type StepProgress = { filled: number; total: number; complete: boolean }

/** ตรวจความครบถ้วนแต่ละส่วน — คืนสัดส่วนช่องที่กรอกแล้ว */
function computeStepProgress(data: UnitProfileWorksheet): StepProgress[] {
  const cqiRows = [
    ...data.cqiInProgress.y2023,
    ...data.cqiInProgress.y2024,
    ...data.cqiInProgress.y2025,
  ]
  const hasCqiRows = cqiRows.some((r) => nonEmpty(r.topic) || nonEmpty(r.result))
  const hasDali = Object.values(data.daliFramework).some(nonEmpty)

  const groups: boolean[][] = [
    [
      nonEmpty(data.unitHeader),
      nonEmpty(data.unit),
      nonEmpty(data.visionFaculty),
      nonEmpty(data.visionHospital),
      nonEmpty(data.coreValue),
    ],
    [anyList(data.missionOfUnit), anyList(data.missionAlignment)],
    [isRiskAssessmentsFilled(data.riskAssessments ?? [])],
    [anyList(data.strategyMedUp), anyList(data.unitStrategy)],
    [hasCqiRows, hasDali],
    [
      isCqiPlansFilled(data.cqiPlans ?? []),
    ],
    [anyList(data.kpiIndicators), anyList(data.kpiResults), anyList(data.bestPractices), nonEmpty(data.preparedBy)],
  ]

  return groups.map((bools) => {
    const filled = bools.filter(Boolean).length
    return { filled, total: bools.length, complete: filled === bools.length }
  })
}

function StepNav({
  steps,
  progress,
  active,
  onSelect,
}: {
  steps: StepDef[]
  progress: StepProgress[]
  active: number
  onSelect: (index: number) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const st = progress[i]
        const isActive = i === active
        const isComplete = st.complete
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              'group flex min-w-[9.5rem] flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
              isActive
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40'
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition',
                isComplete
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {isComplete ? <Check className="size-4" /> : step.num}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block truncate text-xs font-semibold',
                  isActive ? 'text-primary' : 'text-foreground'
                )}
              >
                {step.title}
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">{step.titleTh}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function WorksheetFormSkeleton() {
  return (
    <div className="space-y-5">
      <div className={cn(surfaceCardClass(), 'space-y-4 p-5')}>
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
      <div className={cn(surfaceCardClass(), 'space-y-3 p-4')}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 flex-1 rounded-xl" />
          ))}
        </div>
      </div>
      <div className={cn(surfaceCardClass(), 'space-y-4 p-5')}>
        <Skeleton className="h-9 w-full rounded-md" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

function SaveStatus({
  isSaving,
  isDirty,
  lastSavedAt,
}: {
  isSaving: boolean
  isDirty: boolean
  lastSavedAt: Date | null
}) {
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        กำลังบันทึก...
      </span>
    )
  }
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <AlertTriangle className="size-3.5" />
        มีการแก้ไขที่ยังไม่ได้บันทึก
      </span>
    )
  }
  if (lastSavedAt) {
    const time = lastSavedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="size-3.5" />
        บันทึกอัตโนมัติแล้ว · {time}
      </span>
    )
  }
  return null
}

export function UnitProfileWorksheetForm({
  worksheetId,
  duplicateFromId,
  onSavedAction,
  onCreateNewAction,
}: {
  worksheetId?: string | null
  duplicateFromId?: string | null
  onSavedAction?: (id: string) => void
  onCreateNewAction?: () => void
}) {
  const router = useRouter()
  const [data, setData] = useState<UnitProfileWorksheet>(createEmptyWorksheet)
  const [activeStep, setActiveStep] = useState(0)
  const [currentId, setCurrentId] = useState<string | undefined>(worksheetId ?? undefined)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const { data: remote, isLoading } = useWorksheet(worksheetId ?? undefined)
  const { data: duplicateSource } = useWorksheet(duplicateFromId ?? undefined)
  const saveMutation = useSaveWorksheet()
  const submitMutation = useSubmitWorksheet()
  const isReadOnly = remote ? remote.canEdit === false : false
  const isSaving = saveMutation.isPending || submitMutation.isPending

  // เก็บ snapshot ของข้อมูลที่บันทึกล่าสุด เพื่อตรวจว่ามีการแก้ไขที่ยังไม่ได้บันทึกหรือไม่
  const savedSnapshotRef = useRef<string>('')
  const duplicateLoadedRef = useRef(false)
  const preparedByWrapRef = useRef<HTMLDivElement>(null)
  const [fieldHighlight, setFieldHighlight] = useState<'preparedBy' | null>(null)

  useEffect(() => {
    setCurrentId(worksheetId ?? undefined)
  }, [worksheetId])

  useEffect(() => {
    if (remote?.formData) {
      const next = normalizeWorksheet(remote.formData)
      setData(next)
      savedSnapshotRef.current = JSON.stringify(next)
      setIsDirty(false)
      return
    }
    if (!worksheetId && !duplicateFromId) {
      try {
        const raw = localStorage.getItem(WORKSHEET_STORAGE_KEY)
        if (raw) {
          const next = normalizeWorksheet(JSON.parse(raw))
          setData(next)
          savedSnapshotRef.current = JSON.stringify(next)
        }
      } catch {
        /* ignore */
      }
    }
  }, [remote, worksheetId, duplicateFromId])

  // โหลดข้อมูลจากเอกสารต้นฉบับเมื่อทำสำเนา (เป็นเอกสารใหม่ ไม่ผูก id เดิม)
  useEffect(() => {
    if (!duplicateFromId || duplicateLoadedRef.current) return
    if (duplicateSource?.formData) {
      duplicateLoadedRef.current = true
      setData(normalizeWorksheet(duplicateSource.formData))
      setCurrentId(undefined)
      setActiveStep(0)
      setIsDirty(true)
      savedSnapshotRef.current = ''
      showSuccessToast('คัดลอกข้อมูลจากเอกสารเดิมแล้ว — บันทึกเพื่อสร้างเป็นเอกสารใหม่')
    }
  }, [duplicateFromId, duplicateSource])

  // ตรวจสถานะ dirty ทุกครั้งที่ข้อมูลเปลี่ยน
  useEffect(() => {
    if (isReadOnly) return
    setIsDirty(JSON.stringify(data) !== savedSnapshotRef.current)
  }, [data, isReadOnly])

  const patch = <K extends keyof UnitProfileWorksheet>(key: K, value: UnitProfileWorksheet[K]) => {
    if (isReadOnly) return
    if (key === 'preparedBy' && fieldHighlight === 'preparedBy' && nonEmpty(String(value))) {
      setFieldHighlight(null)
    }
    setData((prev) => {
      if (key === 'cqiPlans') {
        const plans = value as UnitProfileWorksheet['cqiPlans']
        return { ...prev, cqiPlans: plans, ...syncLegacyCqiFields(plans) }
      }
      if (key === 'riskAssessments') {
        const assessments = value as UnitProfileWorksheet['riskAssessments']
        return { ...prev, riskAssessments: assessments, ...syncLegacyRiskFields(assessments) }
      }
      return { ...prev, [key]: value }
    })
  }

  const focusPreparedByField = useCallback(() => {
    window.setTimeout(() => {
      preparedByWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = preparedByWrapRef.current?.querySelector('input')
      input?.focus()
    }, 120)
  }, [])

  const saveAsync = saveMutation.mutateAsync
  const persist = useCallback(async () => {
    const snapshot = JSON.stringify(data)
    const result = await saveAsync({
      id: currentId,
      formData: data,
    })
    setCurrentId(result.id)
    try {
      localStorage.setItem(WORKSHEET_STORAGE_KEY, snapshot)
    } catch {
      /* ignore */
    }
    savedSnapshotRef.current = snapshot
    setIsDirty(false)
    setLastSavedAt(new Date())
    onSavedAction?.(result.id)
    return result
  }, [data, currentId, saveAsync, onSavedAction])

  const saveDraft = async () => {
    try {
      await persist()
      showSuccessToast('บันทึกแบบร่างลงระบบแล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกแบบร่างไม่สำเร็จ')
    }
  }

  const submitDocument = async () => {
    // ตรวจสอบความครบถ้วนก่อนส่ง
    const progress = computeStepProgress(data)
    const firstIncomplete = progress.findIndex((p) => !p.complete)
    const hardMissing: string[] = []
    if (!nonEmpty(data.unit) && !nonEmpty(data.unitHeader)) hardMissing.push('ชื่อหน่วยงาน (Unit)')
    if (!nonEmpty(data.preparedBy)) hardMissing.push('ผู้จัดทำ (Prepared by)')

    if (hardMissing.length > 0) {
      if (!nonEmpty(data.unit) && !nonEmpty(data.unitHeader)) {
        setFieldHighlight(null)
        setActiveStep(0)
        showErrorToast(`กรุณากรอก: ${hardMissing.join(', ')} ก่อนส่งเอกสาร`)
        return
      }
      if (!nonEmpty(data.preparedBy)) {
        setActiveStep(STEP_DEFS.length - 1)
        setFieldHighlight('preparedBy')
        showErrorToast('กรุณากรอก: ผู้จัดทำ (Prepared by) ก่อนส่งเอกสาร')
        return
      }
      setFieldHighlight(null)
      setActiveStep(STEP_DEFS.length - 1)
      showErrorToast(`กรุณากรอก: ${hardMissing.join(', ')} ก่อนส่งเอกสาร`)
      return
    }

    setFieldHighlight(null)

    if (firstIncomplete !== -1) {
      const incompleteCount = progress.filter((p) => !p.complete).length
      const proceed = window.confirm(
        `ยังกรอกไม่ครบทุกส่วน (เหลือ ${incompleteCount} ส่วน)\nต้องการส่งเอกสารเลยหรือไม่?`
      )
      if (!proceed) {
        setActiveStep(firstIncomplete)
        return
      }
    }

    try {
      let id = currentId
      if (!id) {
        const saved = await persist()
        id = saved.id
      } else if (isDirty) {
        await persist()
      }
      await submitMutation.mutateAsync({ id: id!, formData: data })
      // ส่งสำเร็จแล้ว: ล้างแบบร่างและรีเซ็ตฟอร์มกลับเป็นค่าว่าง เพื่อพร้อมกรอกชุดใหม่
      try {
        localStorage.removeItem(WORKSHEET_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      const empty = createEmptyWorksheet()
      setData(empty)
      savedSnapshotRef.current = JSON.stringify(empty)
      setIsDirty(false)
      setCurrentId(undefined)
      setActiveStep(0)
      showSuccessToast('ส่งเอกสารแล้ว')
      router.push(`/dashboard/service-profile/preview?id=${id}`)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ส่งเอกสารไม่สำเร็จ')
    }
  }

  const goPreview = async () => {
    try {
      const result = await persist()
      router.push(`/dashboard/service-profile/preview?id=${result.id}`)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกก่อนดูตัวอย่างไม่สำเร็จ')
    }
  }

  const startNewDocument = () => {
    const hasData = currentId || totalFilled > 0
    if (hasData && !window.confirm('สร้างเอกสารใหม่? ข้อมูลที่ยังไม่ได้บันทึกจะถูกล้าง')) {
      return
    }
    try {
      localStorage.removeItem(WORKSHEET_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    const empty = createEmptyWorksheet()
    setData(empty)
    savedSnapshotRef.current = JSON.stringify(empty)
    setIsDirty(false)
    setLastSavedAt(null)
    setCurrentId(undefined)
    setActiveStep(0)
    onCreateNewAction?.()
    showSuccessToast('เริ่มเอกสารใหม่แล้ว')
  }

  const stepProgress = useMemo(() => computeStepProgress(data), [data])
  const totalFilled = stepProgress.reduce((s, p) => s + p.filled, 0)
  const totalFields = stepProgress.reduce((s, p) => s + p.total, 0)
  const overallPct = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0
  const completeSteps = stepProgress.filter((p) => p.complete).length
  const activeDef = STEP_DEFS[activeStep]
  const activeStatus = stepProgress[activeStep]
  const isLastStep = activeStep === STEP_DEFS.length - 1

  useEffect(() => {
    if (fieldHighlight !== 'preparedBy' || activeStep !== STEP_DEFS.length - 1) return
    focusPreparedByField()
  }, [fieldHighlight, activeStep, focusPreparedByField])

  // บันทึกอัตโนมัติ: หน่วง 4 วินาทีหลังหยุดพิมพ์ เมื่อมีข้อมูลและยังไม่ได้บันทึก
  useEffect(() => {
    if (isReadOnly || !isDirty || isSaving || totalFilled === 0) return
    const timer = setTimeout(() => {
      void persist().catch(() => {
        /* เงียบไว้ ไม่รบกวนผู้ใช้ระหว่างพิมพ์ */
      })
    }, 4000)
    return () => clearTimeout(timer)
  }, [data, isDirty, isReadOnly, isSaving, totalFilled, persist])

  // เตือนก่อนปิด/รีเฟรชหน้า เมื่อมีข้อมูลที่ยังไม่ได้บันทึก
  useEffect(() => {
    if (isReadOnly || !isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isReadOnly])

  const goNext = () => setActiveStep((s) => Math.min(STEP_DEFS.length - 1, s + 1))
  const goPrev = () => setActiveStep((s) => Math.max(0, s - 1))

  const renderStep = () => {
    switch (activeDef.key) {
      case 'unit':
        return (
          <div className="space-y-3">
            <SectionHeader>1. Unit Information (ข้อมูลพื้นฐานหน่วยงาน)</SectionHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Unit :">
                <Input value={data.unit} onChange={(e) => patch('unit', e.target.value)} />
              </FieldRow>
              <FieldRow label="Core Value :">
                <WorksheetHighlightBox>
                  <p className="whitespace-pre-wrap leading-relaxed">{CORE_VALUE}</p>
                </WorksheetHighlightBox>
              </FieldRow>
              <FieldRow label="Vision - Faculty :">
                <Input value={data.visionFaculty} onChange={(e) => patch('visionFaculty', e.target.value)} />
              </FieldRow>
              <FieldRow label="Vision - Hospital :">
                <WorksheetHighlightBox>
                  <p className="leading-relaxed">{VISION_HOSPITAL}</p>
                </WorksheetHighlightBox>
              </FieldRow>
            </div>
            <FieldRow label="เข็มมุ่ง (Focus area) :">
              <FacultyFocusAreaBox />
            </FieldRow>
          </div>
        )
      case 'mission':
        return (
          <div className="space-y-4">
            <SectionHeader>2. Mission (พันธกิจ)</SectionHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <FixedNumberedList
                label="Mission (in Alignment with Organization)"
                items={MISSION_ALIGNMENT_FIXED_ITEMS}
              />
              <NumberedList
                label="Mission (of Unit)"
                values={data.missionOfUnit}
                onChange={(v) => patch('missionOfUnit', v)}
              />
            </div>
          </div>
        )
      case 'risk':
        return (
          <div className="space-y-4">
            <SectionHeader>3. Risk Matrix (ตารางประเมินความเสี่ยง)</SectionHeader>
            <RiskAssessmentsPanel
              assessments={data.riskAssessments ?? []}
              onChange={(assessments) => patch('riskAssessments', assessments)}
              readOnly={isReadOnly}
            />
          </div>
        )
      case 'strategy':
        return (
          <div className="space-y-4">
            <SectionHeader>4. Strategy (ยุทธศาสตร์)</SectionHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <FixedNumberedList
                label="Strategy (MED UP)"
                items={STRATEGY_MED_UP_FIXED_ITEMS}
                numbered={false}
              />
              <NumberedList label="Unit Strategy" values={data.unitStrategy} onChange={(v) => patch('unitStrategy', v)} />
            </div>
          </div>
        )
      case 'cqi':
        return (
          <div className="space-y-4">
            <SectionHeader>5. CQI in Progress (งานพัฒนาคุณภาพที่กำลังดำเนินการ)</SectionHeader>
            <div className="grid gap-4 md:grid-cols-3">
              <CqiYearTable
                year="2023"
                rows={data.cqiInProgress.y2023}
                onChange={(rows) => patch('cqiInProgress', { ...data.cqiInProgress, y2023: rows })}
              />
              <CqiYearTable
                year="2024"
                rows={data.cqiInProgress.y2024}
                onChange={(rows) => patch('cqiInProgress', { ...data.cqiInProgress, y2024: rows })}
              />
              <CqiYearTable
                year="2025"
                rows={data.cqiInProgress.y2025}
                onChange={(rows) => patch('cqiInProgress', { ...data.cqiInProgress, y2025: rows })}
              />
            </div>
            <DaliFrameworkDiagram
              value={data.daliFramework}
              onChange={(next) => patch('daliFramework', next)}
              readOnly={isReadOnly}
            />
          </div>
        )
      case 'plan':
        return (
          <div className="space-y-4">
            <SectionHeader variant="rose">6. CQI Development Plan (แผนการทำโครงการพัฒนาคุณภาพ)</SectionHeader>
            <CqiDevelopmentPlansPanel
              plans={data.cqiPlans ?? []}
              onChange={(plans) => patch('cqiPlans', plans)}
              readOnly={isReadOnly}
            />
          </div>
        )
      case 'kpi':
        return (
          <div className="space-y-4">
            <SectionHeader>7. KPI / Key Results / Best Practice (ตัวชี้วัด / ผลลัพธ์ / แนวปฏิบัติที่เป็นเลิศ)</SectionHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <NumberedList
                label="KPI / Key Success Indicators"
                values={data.kpiIndicators}
                onChange={(v) => patch('kpiIndicators', v)}
                count={3}
              />
              <NumberedList
                label="Results/Target"
                values={data.kpiResults}
                onChange={(v) => patch('kpiResults', v)}
                count={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground/80">Best Practice / Key Learnings</p>
                <NumberedList
                  label=""
                  values={data.bestPractices}
                  onChange={(v) => patch('bestPractices', v)}
                  count={3}
                />
              </div>
              <div
                ref={preparedByWrapRef}
                className={cn(
                  'space-y-1.5 rounded-lg transition-all',
                  fieldHighlight === 'preparedBy' &&
                    'border-2 border-rose-600 bg-rose-50/40 p-2 shadow-[0_0_0_3px_rgba(244,63,94,0.25)] animate-pulse'
                )}
              >
                <Label
                  className={cn(
                    'text-xs font-semibold text-foreground/80',
                    fieldHighlight === 'preparedBy' && 'text-rose-700'
                  )}
                >
                  Prepared by :
                </Label>
                <Input
                  value={data.preparedBy}
                  onChange={(e) => patch('preparedBy', e.target.value)}
                  aria-invalid={fieldHighlight === 'preparedBy'}
                  className={cn(
                    fieldHighlight === 'preparedBy' &&
                      'border-rose-600 bg-white focus-visible:border-rose-600 focus-visible:ring-rose-400/40'
                  )}
                />
                {fieldHighlight === 'preparedBy' ? (
                  <p className="text-xs font-medium text-rose-600">กรุณากรอกผู้จัดทำ (Prepared by)</p>
                ) : null}
              </div>
            </div>

            {hasKpiDashboardData({
              kpiIndicators: data.kpiIndicators,
              kpiResults: data.kpiResults,
              bestPractices: data.bestPractices,
            }) ? (
              <KpiResultsDashboard
                data={{
                  kpiIndicators: data.kpiIndicators,
                  kpiResults: data.kpiResults,
                  bestPractices: data.bestPractices,
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-primary/20 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                กรอก KPI หรือ Results/Target อย่างน้อย 1 รายการ
                <br />
                <span className="text-[10px]">เพื่อแสดง Dashboard สรุปผลตัวชี้วัดอัตโนมัติ</span>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading && worksheetId) {
    return <WorksheetFormSkeleton />
  }

  return (
    <div className="space-y-5">
      {isReadOnly ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          เอกสารนี้ดูอย่างเดียว — แก้ไขได้เฉพาะแบบร่าง
        </div>
      ) : null}

      {/* Document header */}
      <div className={cn(surfaceCardClass(), 'overflow-hidden p-0')}>
        <div className="flex flex-col gap-4 border-b border-primary/10 bg-gradient-to-r from-[#1e5a9e]/10 via-white to-secondary/5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <HaLogo size="md" framed priority />
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-[#1e5a9e] sm:text-2xl">
                 Unit Profile
              </h2>
              <p className="text-sm font-semibold text-[#1e5a9e]/80"></p>
            </div>
          </div>
          <div className="grid gap-3 sm:min-w-[14rem]">
            <FieldRow label="Date :">
              <Input type="date" value={data.date} onChange={(e) => patch('date', e.target.value)} />
            </FieldRow>
            <FieldRow label="Unit :">
              <Input value={data.unitHeader} onChange={(e) => patch('unitHeader', e.target.value)} />
            </FieldRow>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border/60 bg-muted/20 px-4 py-2">
          <span className="mr-auto flex flex-wrap items-center gap-3 self-center">
            {!isReadOnly ? (
              <SaveStatus isSaving={isSaving} isDirty={isDirty} lastSavedAt={lastSavedAt} />
            ) : null}
            {currentId ? (
              <span className="font-mono text-xs font-semibold text-primary">เลขที่เอกสาร: {currentId}</span>
            ) : null}
          </span>
          {!isReadOnly ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startNewDocument}
                disabled={isSaving}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="size-4" />
                สร้างเอกสารใหม่
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void saveDraft()} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                บันทึกแบบร่าง
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void goPreview()} disabled={isSaving}>
                <Eye className="size-4" />
                ดูตัวอย่าง
              </Button>
              <Button type="button" size="sm" onClick={() => void submitDocument()} disabled={isSaving}>
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                ส่งเอกสาร
              </Button>
            </>
          ) : (
            <Link
              href={`/dashboard/service-profile/preview?id=${currentId}`}
              className={buttonVariants({ size: 'sm' })}
            >
              <Eye className="size-4" />
              ดู / ดาวน์โหลด
            </Link>
          )}
        </div>
      </div>

      {/* Progress overview */}
      <div className={cn(surfaceCardClass(), 'space-y-3 p-4')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-foreground">ความคืบหน้าการกรอกข้อมูล</p>
            <p className="text-xs text-muted-foreground">
              เสร็จสมบูรณ์ {completeSteps}/{STEP_DEFS.length} ส่วน · กรอกแล้ว {totalFilled}/{totalFields} ช่อง
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-sm font-bold tabular-nums',
              overallPct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
            )}
          >
            {overallPct}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              overallPct === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                : 'bg-gradient-to-r from-primary to-[#2b7bc0]'
            )}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <StepNav steps={STEP_DEFS} progress={stepProgress} active={activeStep} onSelect={setActiveStep} />
      </div>

      {/* Active step */}
      <fieldset disabled={isReadOnly} className="contents">
        <section className={cn(surfaceCardClass(), 'space-y-4 p-4 sm:p-5')}>
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                ส่วนที่ {activeDef.num} จาก {STEP_DEFS.length}
              </span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                activeStatus.complete
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              )}
            >
              {activeStatus.complete ? (
                <>
                  <Check className="size-3.5" />
                  กรอกครบแล้ว
                </>
              ) : (
                <>ยังไม่ครบ · {activeStatus.filled}/{activeStatus.total} ช่อง</>
              )}
            </span>
          </div>

          {renderStep()}

          {/* Step navigation footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={goPrev} disabled={activeStep === 0}>
              <ChevronLeft className="size-4" />
              ย้อนกลับ
            </Button>

            <div className="flex items-center gap-1.5">
              {STEP_DEFS.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  aria-label={`ไปยังส่วนที่ ${s.num}`}
                  className={cn(
                    'size-2.5 rounded-full transition',
                    i === activeStep
                      ? 'w-5 bg-primary'
                      : stepProgress[i].complete
                        ? 'bg-emerald-500'
                        : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>

            {isLastStep ? (
              !isReadOnly ? (
                <Button type="button" onClick={() => void submitDocument()} disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  ส่งเอกสาร
                </Button>
              ) : (
                <span className="w-[7.5rem]" />
              )
            ) : (
              <Button type="button" onClick={goNext}>
                ถัดไป
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </section>
      </fieldset>
    </div>
  )
}
