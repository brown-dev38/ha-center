'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Maximize2, X } from 'lucide-react'

import { cn } from '@/app/common/utils'
import type { DaliFrameworkData } from '@/app/service-profile/worksheet-types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Tone = 'green' | 'red' | 'amber'

/**
 * ความหนาแน่นของเลย์เอาต์
 * - `print` : ขนาดกระชับ ใช้ในหน้าเอกสาร/พิมพ์ (คงของเดิมไว้ ไม่ให้กระทบการจัดหน้า)
 * - `edit`  : ขนาดใหญ่ กรอกข้อมูลสะดวก ใช้ในฟอร์ม
 * - `full`  : ขนาดใหญ่สุด ใช้ในโหมดดูเต็มจอ
 */
type Density = 'print' | 'edit' | 'full'

type DensityTokens = {
  headPad: string
  headEn: string
  headTh: string
  stepDot: string
  body: string
  field: string
  read: string
  phaseTitle: string
  phaseSub: string
  phaseDot: string
}

const DENSITY: Record<Density, DensityTokens> = {
  print: {
    headPad: 'px-2.5 py-1.5',
    headEn: 'text-[11px] sm:text-xs',
    headTh: 'text-[10px]',
    stepDot: 'size-4 text-[9px]',
    body: 'p-2',
    field: 'px-2.5 py-1.5 text-[11px] min-h-[2.5rem]',
    read: 'px-2.5 py-1.5 text-[11px] min-h-[2.25rem]',
    phaseTitle: 'text-[13px]',
    phaseSub: 'text-[10px]',
    phaseDot: 'size-6 text-[11px]',
  },
  edit: {
    headPad: 'px-3.5 py-2.5',
    headEn: 'text-[13px]',
    headTh: 'text-[11px]',
    stepDot: 'size-5 text-[10px]',
    body: 'p-3',
    field: 'px-3 py-2.5 text-[13px] min-h-[4.75rem]',
    read: 'px-3 py-2.5 text-[13px] min-h-[3rem]',
    phaseTitle: 'text-[15px]',
    phaseSub: 'text-[11px]',
    phaseDot: 'size-7 text-xs',
  },
  full: {
    headPad: 'px-4 py-3',
    headEn: 'text-sm',
    headTh: 'text-xs',
    stepDot: 'size-5 text-[10px]',
    body: 'p-4',
    field: 'px-3.5 py-3 text-sm min-h-[5.5rem]',
    read: 'px-3.5 py-3 text-[15px] min-h-[3.5rem]',
    phaseTitle: 'text-base',
    phaseSub: 'text-xs',
    phaseDot: 'size-7 text-xs',
  },
}

/** แถบหัวการ์ดแต่ละโทน — ไล่เฉดให้ดูพรีเมียม */
const TONE_BAND: Record<Tone, string> = {
  green: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
  red: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
  amber: 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950',
}

const TONE_FOCUS: Record<Tone, string> = {
  green: 'focus:border-emerald-400 focus:ring-emerald-300/40',
  red: 'focus:border-rose-400 focus:ring-rose-300/40',
  amber: 'focus:border-amber-400 focus:ring-amber-300/40',
}

const FIELD_BASE =
  'w-full rounded-lg border border-slate-200 bg-white leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-300 focus:ring-2 [overflow-wrap:anywhere]'

const READ_BASE =
  'whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50/70 leading-relaxed text-slate-700 [overflow-wrap:anywhere]'

/** ช่องกรอกที่ขยายความสูงตามเนื้อหาอัตโนมัติ — พิมพ์ยาวแค่ไหนก็เห็นครบ ไม่ต้องลากขยาย */
function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
  minRows = 2,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  className?: string
  minRows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const fit = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    fit()
  }, [fit, value])

  useEffect(() => {
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fit])

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn('resize-none overflow-hidden', className)}
    />
  )
}

function SharedDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <linearGradient id="dali-sky" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="dali-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <filter id="dali-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.28" />
        </filter>
      </defs>
    </svg>
  )
}

/** ป้ายกำกับหัวข้อแต่ละเฟส (kicker) */
function PhaseLabel({
  step,
  title,
  sub,
  accent,
  density = 'print',
}: {
  step: string
  title: string
  sub?: string
  accent: string
  density?: Density
}) {
  const d = DENSITY[density]
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm',
          d.phaseDot,
          accent
        )}
      >
        {step}
      </span>
      <div className="min-w-0">
        <p className={cn('font-bold leading-tight text-slate-800', d.phaseTitle)}>{title}</p>
        {sub ? <p className={cn('leading-tight text-slate-400', d.phaseSub)}>{sub}</p> : null}
      </div>
    </div>
  )
}

/** การ์ดเวที (3C / Purpose / Design / DALI) — หัวสีไล่เฉด + ช่องกรอกพื้นขาว */
function StageCard({
  en,
  th,
  tone,
  value,
  onChange,
  readOnly,
  minRows = 2,
  placeholder,
  density = 'print',
  step,
  className,
}: {
  en: string
  th: string
  tone: Tone
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  minRows?: number
  placeholder?: string
  density?: Density
  step?: string
  className?: string
}) {
  const d = DENSITY[density]
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.25)] ring-1 ring-black/5 transition focus-within:shadow-[0_6px_18px_-8px_rgba(15,23,42,0.4)]',
        className
      )}
    >
      <div className={cn('flex items-center gap-1.5', d.headPad, TONE_BAND[tone])}>
        {step ? (
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full bg-white/70 font-bold text-slate-700',
              d.stepDot
            )}
          >
            {step}
          </span>
        ) : null}
        <span className={cn('font-bold leading-tight', d.headEn)}>{en}</span>
        <span className={cn('ml-auto font-medium opacity-90', d.headTh)}>{th}</span>
      </div>
      <div className={cn('flex-1', d.body)}>
        {readOnly ? (
          <p className={cn(READ_BASE, d.read)}>{value.trim() || '—'}</p>
        ) : (
          <AutoTextarea
            value={value}
            onChange={onChange}
            minRows={minRows}
            placeholder={placeholder ?? 'กรอก...'}
            className={cn(FIELD_BASE, TONE_FOCUS[tone], d.field)}
          />
        )}
      </div>
    </div>
  )
}

/** การ์ด Improve — เน้นเป็นหัวใจของวงจร (อยู่ในตาราง 2×2) */
function ImproveCard({
  step,
  value,
  onChange,
  readOnly,
  density = 'print',
}: {
  step: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  density?: Density
}) {
  const d = DENSITY[density]
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border-2 border-amber-400 bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.25)] transition focus-within:shadow-[0_6px_18px_-8px_rgba(15,23,42,0.4)]">
      <div className={cn('flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950', d.headPad)}>
        <span className={cn('flex items-center justify-center rounded-full bg-white/70 font-bold', d.stepDot)}>
          {step}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M6.2 6.2l2.5 2.5M15.3 15.3l2.5 2.5M6.2 17.8l2.5-2.5M15.3 8.7l2.5-2.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
        </svg>
        <span className={cn('font-extrabold leading-tight', d.headEn)}>Improve</span>
        <span className={cn('ml-auto font-medium opacity-90', d.headTh)}>ปรับปรุง</span>
      </div>
      <div className={cn('flex-1', d.body)}>
        {readOnly ? (
          <p className={cn(READ_BASE, d.read)}>{value.trim() || '—'}</p>
        ) : (
          <AutoTextarea
            value={value}
            onChange={onChange}
            minRows={density === 'print' ? 1 : 2}
            placeholder="กรอก..."
            className={cn(FIELD_BASE, TONE_FOCUS.amber, d.field)}
          />
        )}
      </div>
    </div>
  )
}

/** สัญลักษณ์วงจรหมุน (วางตรงจุดตัดกลางตาราง 2×2) */
function CycleBadge({ className }: { className?: string }) {
  const cx = 50
  const cy = 50
  const r = 30
  const polar = (deg: number, rad = r) => {
    const a = ((deg - 90) * Math.PI) / 180
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }
  }
  const arc = (s: number, e: number) => {
    const a = polar(s)
    const b = polar(e)
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
  }
  // สองส่วนโค้งตามเข็มนาฬิกา พร้อมหัวลูกศร
  const segs = [
    { s: 20, e: 160 },
    { s: 200, e: 340 },
  ]
  return (
    <span
      className={cn(
        'pointer-events-none flex size-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200',
        className
      )}
      aria-hidden
    >
      <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
        {segs.map((g) => {
          const tip = polar(g.e)
          return (
            <g key={g.s}>
              <path d={arc(g.s, g.e)} stroke="url(#dali-ring)" strokeWidth="7" strokeLinecap="round" />
              <g transform={`translate(${tip.x.toFixed(2)} ${tip.y.toFixed(2)}) rotate(${g.e})`}>
                <path d="M -3 -6 L 8 0 L -3 6 Z" fill="#0ea5e9" />
              </g>
            </g>
          )
        })}
      </svg>
    </span>
  )
}

/** การ์ดข้อมูลด้านข้าง (Patient Care / Monitor & Learning) */
function SideCard({
  title,
  value,
  onChange,
  readOnly,
  placeholder,
  density = 'print',
}: {
  title: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  placeholder?: string
  density?: Density
}) {
  const d = DENSITY[density]
  return (
    <div className="rounded-xl border border-sky-200 bg-white shadow-sm transition focus-within:shadow-md">
      <div className={cn('flex items-center gap-1.5 rounded-t-xl border-b border-sky-100 bg-sky-50/80', d.headPad)}>
        <span className="size-1.5 rounded-full bg-sky-500" aria-hidden />
        <p className={cn('font-bold text-sky-800', d.headEn)}>{title}</p>
      </div>
      <div className={d.body}>
        {readOnly ? (
          <p className={cn('whitespace-pre-wrap leading-relaxed text-sky-900', d.read, 'border-sky-100 bg-sky-50/40')}>
            {value.trim() || '—'}
          </p>
        ) : (
          <AutoTextarea
            value={value}
            onChange={onChange}
            minRows={4}
            placeholder={placeholder}
            className={cn(
              FIELD_BASE,
              'border-sky-100 bg-sky-50/30 text-sky-950 placeholder:text-sky-300 focus:border-sky-400 focus:ring-sky-300/30',
              d.field
            )}
          />
        )}
      </div>
    </div>
  )
}

/**
 * ลูกศรรวม 3C → Purpose (เลย์เอาต์เอกสาร)
 * เส้นโค้งยืดตามความสูงคอลัมน์ แต่ความหนาเส้นและหัวลูกศรคงขนาดจริงไว้เสมอ จึงไม่บิดเบี้ยว
 */
function ConvergeArrows({ className }: { className?: string }) {
  return (
    <span className={cn('pointer-events-none relative block', className)} aria-hidden>
      <svg className="h-full w-full" viewBox="0 0 60 240" fill="none" preserveAspectRatio="none">
        <path
          d="M2 26 C30 26 32 104 50 119"
          stroke="url(#dali-sky)"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M2 120 H50" stroke="url(#dali-sky)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path
          d="M2 214 C30 214 32 136 50 121"
          stroke="url(#dali-sky)"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2"
        width="13"
        height="16"
        viewBox="0 0 13 16"
        fill="none"
      >
        <path d="M1 1 L12 8 L1 15 Z" fill="#0ea5e9" stroke="#0ea5e9" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

type ConnectorTone = 'sky' | 'pink'

const CONNECTOR_TONE: Record<ConnectorTone, { rail: string; badge: string; glow: string }> = {
  sky: {
    rail: 'from-sky-200/0 via-sky-400 to-sky-500',
    badge: 'ring-sky-400/80 text-sky-600',
    glow: 'shadow-[0_2px_12px_-2px_rgba(14,165,233,0.55)]',
  },
  pink: {
    rail: 'from-pink-200/0 via-pink-400 to-pink-500',
    badge: 'ring-pink-400/80 text-pink-600',
    glow: 'shadow-[0_2px_12px_-2px_rgba(236,72,153,0.55)]',
  },
}

/**
 * ตัวเชื่อมระหว่างเฟส — รางไล่เฉด + ป้ายลูกศรทรงกลม
 * วาดด้วย layout ล้วน จึงคมชัดและได้สัดส่วนเดิมทุกขนาดหน้าจอ
 */
function PhaseConnector({
  direction = 'right',
  tone = 'sky',
  className,
}: {
  direction?: 'right' | 'down'
  tone?: ConnectorTone
  className?: string
}) {
  const t = CONNECTOR_TONE[tone]
  const Icon = direction === 'right' ? ChevronRight : ChevronDown
  const badge = (
    <span
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full bg-white ring-2',
        t.badge,
        t.glow
      )}
    >
      <Icon className="size-4" strokeWidth={3} />
    </span>
  )

  if (direction === 'down') {
    return (
      <div className={cn('relative flex h-14 items-center justify-center', className)} aria-hidden>
        <span className={cn('absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b', t.rail)} />
        {badge}
      </div>
    )
  }

  return (
    <div className={cn('relative flex items-center justify-center self-stretch', className)} aria-hidden>
      <span className={cn('absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r', t.rail)} />
      {badge}
    </div>
  )
}

/** ลูกศรชมพู Purpose → Design (แนวนอน) */
function FlowArrowH({ className }: { className?: string }) {
  return (
    <svg className={cn('shrink-0', className)} width="42" height="24" viewBox="0 0 42 24" fill="none" aria-hidden>
      <path d="M3 12 H30" stroke="#ec4899" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M27 6 L39 12 L27 18 Z" fill="#ec4899" />
    </svg>
  )
}

/** ลูกศรแนวตั้ง (มือถือ) */
function FlowArrowV({ color = '#0ea5e9', className }: { color?: string; className?: string }) {
  return (
    <svg className={cn('mx-auto block', className)} width="24" height="34" viewBox="0 0 24 34" fill="none" aria-hidden>
      <path d="M12 3 V24" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M6 21 L12 31 L18 21 Z" fill={color} />
    </svg>
  )
}

const CARE_DESIGN_BULLETS = ['Evidence-based / HFE', 'Tacit knowledge', 'Gap Analysis, CareMap']

const KEY_PROCESS_PLACEHOLDER =
  'เน้นกระบวนการสำคัญ / กลุ่มประชากรเป้าหมาย เพื่อให้เกิดการดูแลที่มีประสิทธิภาพสูง (highly effective care) และได้ผลลัพธ์ที่ดี'

/** Clinical CQI — วงจร DALI แบบตาราง 2×2 (PDCA) + การ์ดข้อมูลด้านข้าง */
function ClinicalCqiCycle({
  value,
  onChange,
  readOnly,
  density = 'print',
}: {
  value: DaliFrameworkData
  onChange?: (next: DaliFrameworkData) => void
  readOnly?: boolean
  density?: Density
}) {
  const patch = (key: keyof DaliFrameworkData, next: string) => onChange?.({ ...value, [key]: next })
  const roomy = density !== 'print'

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50/60 via-white to-amber-50/50', roomy ? 'p-4 sm:p-5' : 'p-3 sm:p-4')}>
      {/* วงจร DALI — ตาราง 2×2 หมุนตามเข็มนาฬิกา + สัญลักษณ์วงจรตรงกลาง */}
      <div className="relative">
        <div className={cn('grid grid-cols-2', roomy ? 'gap-4 sm:gap-6' : 'gap-3 sm:gap-4')}>
          <StageCard
            step="1"
            en="Action"
            th="ปฏิบัติ"
            tone="green"
            value={value.action}
            onChange={(v) => patch('action', v)}
            readOnly={readOnly}
            density={density}
            minRows={2}
          />
          <StageCard
            step="2"
            en="Learning"
            th="เรียนรู้"
            tone="red"
            value={value.learning}
            onChange={(v) => patch('learning', v)}
            readOnly={readOnly}
            density={density}
            minRows={2}
          />
          <ImproveCard
            step="4"
            value={value.improve}
            onChange={(v) => patch('improve', v)}
            readOnly={readOnly}
            density={density}
          />
          <StageCard
            step="3"
            en="Spread"
            th="ขยายผล"
            tone="amber"
            value={value.spread}
            onChange={(v) => patch('spread', v)}
            readOnly={readOnly}
            density={density}
            minRows={2}
          />
        </div>
        <CycleBadge className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <p className={cn('mt-3 text-center font-bold tracking-wide text-slate-800', roomy ? 'text-sm' : 'text-[13px]')}>
        Clinical CQI
      </p>

      {/* การ์ดข้อมูล */}
      <div className={cn('mt-3 grid sm:grid-cols-2', roomy ? 'gap-4' : 'gap-3')}>
        <SideCard
          title="Patient Care"
          value={value.patientCare}
          onChange={(v) => patch('patientCare', v)}
          readOnly={readOnly}
          density={density}
          placeholder={'• Care plan implementation\n• Daily huddle\n• Communication\n• Multidisciplinary round'}
        />
        <SideCard
          title="Monitor & Learning"
          value={value.monitorLearning}
          onChange={(v) => patch('monitorLearning', v)}
          readOnly={readOnly}
          density={density}
          placeholder={'• Compliance monitor\n• Outcome monitor\n• KPI-control chart\n• Case conference'}
        />
      </div>
    </div>
  )
}

/** เลย์เอาต์กระชับ 4 คอลัมน์ — ใช้กับหน้าเอกสาร / งานพิมพ์ */
function CompactBody({
  value,
  onChange,
  readOnly,
}: {
  value: DaliFrameworkData
  onChange?: (next: DaliFrameworkData) => void
  readOnly?: boolean
}) {
  const patch = (key: keyof DaliFrameworkData, next: string) => onChange?.({ ...value, [key]: next })

  return (
    <>
      {/* Desktop */}
      <div className="hidden gap-4 md:grid md:grid-cols-[13.5rem_2.5rem_minmax(0,1.2fr)_minmax(0,1.4fr)]">
        {/* COL 1 — 3C */}
        <div className="flex flex-col gap-3">
          <PhaseLabel step="1" title="Key Process / Key Population" accent="bg-emerald-600" />
          {readOnly ? (
            <p className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-600">
              {value.keyProcess.trim() || KEY_PROCESS_PLACEHOLDER}
            </p>
          ) : (
            <AutoTextarea
              value={value.keyProcess}
              onChange={(v) => patch('keyProcess', v)}
              minRows={3}
              placeholder={KEY_PROCESS_PLACEHOLDER}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] leading-relaxed outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300/30"
            />
          )}

          <div className="mt-0.5 flex flex-1 flex-col justify-center gap-3">
            <StageCard en="Core Values & Concepts" th="หลักคิด" tone="green" value={value.coreValues} onChange={(v) => patch('coreValues', v)} readOnly={readOnly} />
            <StageCard en="Context" th="บริบท" tone="red" value={value.context} onChange={(v) => patch('context', v)} readOnly={readOnly} />
            <StageCard en="Criteria" th="เกณฑ์" tone="green" value={value.criteria} onChange={(v) => patch('criteria', v)} readOnly={readOnly} />
          </div>
        </div>

        {/* COL 2 — converge arrows */}
        <div className="flex items-center justify-center self-stretch pt-16">
          <ConvergeArrows className="h-[70%] w-full max-w-[48px]" />
        </div>

        {/* COL 3 — Effective Care Design */}
        <div className="flex flex-col justify-center gap-3">
          <PhaseLabel step="2" title="Effective Care Design" sub="ออกแบบการดูแลที่มีประสิทธิภาพ" accent="bg-sky-600" />
          <ul className="space-y-0.5 rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2 text-[11px] font-medium text-sky-700">
            {CARE_DESIGN_BULLETS.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <StageCard
              en="Purpose"
              th="เป้าหมายเชิงรุก"
              tone="red"
              value={value.purpose}
              onChange={(v) => patch('purpose', v)}
              readOnly={readOnly}
              className="min-w-0 flex-[1.35]"
              minRows={3}
            />
            <FlowArrowH />
            <StageCard
              en="Design"
              th="ออกแบบ"
              tone="amber"
              value={value.design}
              onChange={(v) => patch('design', v)}
              readOnly={readOnly}
              className="min-w-0 flex-[0.95]"
              minRows={3}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-[10px] leading-relaxed text-slate-600 shadow-sm">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
            <span>ทิศทางที่ควรเน้นเพื่อความสำเร็จและความต่อเนื่อง คือ การดูแลผู้ป่วย</span>
          </div>
        </div>

        {/* COL 4 — Clinical CQI */}
        <div className="flex flex-col gap-3">
          <PhaseLabel step="3" title="Clinical CQI (DALI)" sub="วงจรพัฒนาคุณภาพต่อเนื่อง" accent="bg-amber-500" />
          <ClinicalCqiCycle value={value} onChange={onChange} readOnly={readOnly} />
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-4 md:hidden">
        <div>
          <PhaseLabel step="1" title="Key Process / Key Population" accent="bg-emerald-600" />
          {readOnly ? (
            <p className="mt-2 whitespace-pre-wrap text-[11px] text-slate-600">{value.keyProcess.trim() || '—'}</p>
          ) : (
            <AutoTextarea
              value={value.keyProcess}
              onChange={(v) => patch('keyProcess', v)}
              minRows={2}
              placeholder={KEY_PROCESS_PLACEHOLDER}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300/30"
            />
          )}
          <div className="mt-2 space-y-2">
            <StageCard en="Core Values & Concepts" th="หลักคิด" tone="green" value={value.coreValues} onChange={(v) => patch('coreValues', v)} readOnly={readOnly} />
            <StageCard en="Context" th="บริบท" tone="red" value={value.context} onChange={(v) => patch('context', v)} readOnly={readOnly} />
            <StageCard en="Criteria" th="เกณฑ์" tone="green" value={value.criteria} onChange={(v) => patch('criteria', v)} readOnly={readOnly} />
          </div>
        </div>

        <FlowArrowV />

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <PhaseLabel step="2" title="Effective Care Design" accent="bg-sky-600" />
          <ul className="mt-2 space-y-0.5 text-[11px] text-sky-700">
            {CARE_DESIGN_BULLETS.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-3 space-y-2">
            <StageCard en="Purpose" th="เป้าหมายเชิงรุก" tone="red" value={value.purpose} onChange={(v) => patch('purpose', v)} readOnly={readOnly} />
            <FlowArrowV color="#ec4899" />
            <StageCard en="Design" th="ออกแบบ" tone="amber" value={value.design} onChange={(v) => patch('design', v)} readOnly={readOnly} />
          </div>
        </div>

        <FlowArrowV />

        <div>
          <PhaseLabel step="3" title="Clinical CQI (DALI)" accent="bg-amber-500" />
          <div className="mt-2">
            <ClinicalCqiCycle value={value} onChange={onChange} readOnly={readOnly} />
          </div>
        </div>
      </div>
    </>
  )
}

/** หัวข้อย่อยของแต่ละเฟสในเลย์เอาต์ขนาดใหญ่ */
function PhaseSection({
  step,
  title,
  sub,
  accent,
  density,
  children,
  className,
}: {
  step: string
  title: string
  sub?: string
  accent: string
  density: Density
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className
      )}
    >
      <PhaseLabel step={step} title={title} sub={sub} accent={accent} density={density} />
      {children}
    </section>
  )
}

/** เลย์เอาต์ขนาดใหญ่ — บล็อกกว้าง กรอกง่าย ใช้ในฟอร์มและโหมดเต็มจอ */
function RoomyBody({
  value,
  onChange,
  readOnly,
  density,
}: {
  value: DaliFrameworkData
  onChange?: (next: DaliFrameworkData) => void
  readOnly?: boolean
  density: Density
}) {
  const patch = (key: keyof DaliFrameworkData, next: string) => onChange?.({ ...value, [key]: next })
  const d = DENSITY[density]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1.15fr)]">
        {/* เฟส 1 — 3C */}
        <PhaseSection
          step="1"
          title="Key Process / Key Population"
          sub="กระบวนการ / ประชากรเป้าหมาย"
          accent="bg-emerald-600"
          density={density}
        >
          {readOnly ? (
            <p className={cn(READ_BASE, d.read)}>{value.keyProcess.trim() || KEY_PROCESS_PLACEHOLDER}</p>
          ) : (
            <AutoTextarea
              value={value.keyProcess}
              onChange={(v) => patch('keyProcess', v)}
              minRows={3}
              placeholder={KEY_PROCESS_PLACEHOLDER}
              className={cn(FIELD_BASE, 'bg-slate-50/60 focus:border-emerald-400 focus:ring-emerald-300/30', d.field)}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <StageCard
              en="Core Values & Concepts"
              th="หลักคิด"
              tone="green"
              value={value.coreValues}
              onChange={(v) => patch('coreValues', v)}
              readOnly={readOnly}
              density={density}
              minRows={3}
            />
            <StageCard
              en="Context"
              th="บริบท"
              tone="red"
              value={value.context}
              onChange={(v) => patch('context', v)}
              readOnly={readOnly}
              density={density}
              minRows={3}
            />
            <StageCard
              en="Criteria"
              th="เกณฑ์"
              tone="green"
              value={value.criteria}
              onChange={(v) => patch('criteria', v)}
              readOnly={readOnly}
              density={density}
              minRows={3}
            />
          </div>
        </PhaseSection>

        {/* ลูกศรเชื่อมเฟส 1 → เฟส 2 */}
        <PhaseConnector direction="right" className="hidden xl:flex" />
        <PhaseConnector direction="down" className="xl:hidden" />

        {/* เฟส 2 — Effective Care Design */}
        <PhaseSection
          step="2"
          title="Effective Care Design"
          sub="ออกแบบการดูแลที่มีประสิทธิภาพ"
          accent="bg-sky-600"
          density={density}
        >
          <ul className="flex flex-wrap gap-2">
            {CARE_DESIGN_BULLETS.map((item) => (
              <li
                key={item}
                className="rounded-full border border-sky-100 bg-sky-50/70 px-3 py-1 text-xs font-medium text-sky-700"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)]">
            <StageCard
              en="Purpose"
              th="เป้าหมายเชิงรุก"
              tone="red"
              value={value.purpose}
              onChange={(v) => patch('purpose', v)}
              readOnly={readOnly}
              density={density}
              minRows={4}
            />
            <PhaseConnector direction="right" tone="pink" className="hidden w-14 sm:flex" />
            <PhaseConnector direction="down" tone="pink" className="sm:hidden" />
            <StageCard
              en="Design"
              th="ออกแบบ"
              tone="amber"
              value={value.design}
              onChange={(v) => patch('design', v)}
              readOnly={readOnly}
              density={density}
              minRows={4}
            />
          </div>

          <div className="mt-auto flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/40 px-3 py-2 text-xs leading-relaxed text-slate-600">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
            <span>ทิศทางที่ควรเน้นเพื่อความสำเร็จและความต่อเนื่อง คือ การดูแลผู้ป่วย</span>
          </div>
        </PhaseSection>
      </div>

      <PhaseConnector direction="down" />

      {/* เฟส 3 — Clinical CQI */}
      <PhaseSection
        step="3"
        title="Clinical CQI (DALI)"
        sub="วงจรพัฒนาคุณภาพต่อเนื่อง — Action → Learning → Spread → Improve"
        accent="bg-amber-500"
        density={density}
      >
        <ClinicalCqiCycle value={value} onChange={onChange} readOnly={readOnly} density={density} />
      </PhaseSection>
    </div>
  )
}

const FIELD_KEYS: (keyof DaliFrameworkData)[] = [
  'keyProcess',
  'coreValues',
  'context',
  'criteria',
  'purpose',
  'design',
  'action',
  'learning',
  'improve',
  'spread',
  'patientCare',
  'monitorLearning',
]

function countFilled(value: DaliFrameworkData) {
  return FIELD_KEYS.filter((key) => (value[key] ?? '').trim().length > 0).length
}

/** กราฟิก 3C – DALI กับการออกแบบการดูแลผู้ป่วย (กรอกข้อมูลได้) */
export function DaliFrameworkDiagram({
  value,
  onChange,
  readOnly = false,
  className,
}: {
  value: DaliFrameworkData
  onChange?: (next: DaliFrameworkData) => void
  readOnly?: boolean
  className?: string
}) {
  const [fullScreenOpen, setFullScreenOpen] = useState(false)

  const density: Density = readOnly ? 'print' : 'edit'
  const filled = countFilled(value)
  const total = FIELD_KEYS.length
  const percent = Math.round((filled / total) * 100)
  const complete = filled === total

  return (
    <>
      <figure
        className={cn(
          'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_-20px_rgba(15,23,42,0.35)]',
          className
        )}
        aria-label="การประยุกต์ใช้ 3C - DALI กับการออกแบบการดูแลผู้ป่วย"
      >
        <SharedDefs />

        {/* Header */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 px-4 py-3 sm:px-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            aria-hidden
            style={{
              backgroundImage:
                'radial-gradient(circle at 88% -10%, rgba(255,255,255,0.9), transparent 42%), radial-gradient(circle at 12% 120%, rgba(255,255,255,0.5), transparent 45%)',
            }}
          />
          <div className="relative flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/40" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12a8 8 0 1 1 3 6.2"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M4 19v-4h4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-snug text-white sm:text-[15px]">
                การประยุกต์ใช้ 3C – DALI กับการออกแบบการดูแลผู้ป่วย
              </h3>
              <p className="text-[10px] font-medium text-white/80">Applying 3C – DALI to Patient Care Design</p>
            </div>
          </div>
          <div className="relative flex shrink-0 flex-wrap items-center justify-end gap-2">
            {!readOnly && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ring-1',
                  complete
                    ? 'bg-white text-emerald-700 ring-white/60'
                    : 'bg-white/20 text-white ring-white/30'
                )}
              >
                {complete ? <CheckCircle2 className="size-3.5" /> : null}
                กรอกแล้ว {filled}/{total}
              </span>
            )}
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30">
              Clinical CQI
            </span>
            <span className="hidden rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white ring-1 ring-white/30 sm:inline">
              24th HA
            </span>
            {!readOnly && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFullScreenOpen(true)}
                className="h-8 gap-1.5 border-white/40 bg-white/15 text-white hover:border-white hover:bg-white hover:text-emerald-700"
              >
                <Maximize2 className="size-3.5" />
                ดูขนาดเต็ม
              </Button>
            )}
          </div>
        </div>

        {/* แถบความคืบหน้าการกรอก */}
        {!readOnly && (
          <div className="h-1 w-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-r-full transition-all duration-300',
                complete ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-lime-400'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="bg-gradient-to-b from-slate-50/60 to-white p-3 sm:p-4 lg:p-5">
          {readOnly ? (
            <CompactBody value={value} onChange={onChange} readOnly />
          ) : (
            <RoomyBody value={value} onChange={onChange} density={density} />
          )}
        </div>
      </figure>

      {/* โหมดดูขนาดเต็ม — แสดงผลอ่านอย่างเดียวเต็มหน้าจอ */}
      <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[95vh] max-h-[95vh] w-[97vw] max-w-[97vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1600px]"
        >
          <DialogHeader className="relative shrink-0 border-b border-border/60 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 px-5 py-4 pr-14">
            <DialogTitle className="text-white">
              การประยุกต์ใช้ 3C – DALI กับการออกแบบการดูแลผู้ป่วย
            </DialogTitle>
            <DialogDescription className="text-xs text-white/80">
              Applying 3C – DALI to Patient Care Design · กรอกแล้ว {filled}/{total} หัวข้อ
            </DialogDescription>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-3 top-3 text-white hover:bg-white/20 hover:text-white"
                />
              }
            >
              <X />
              <span className="sr-only">ปิด</span>
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
            <RoomyBody value={value} readOnly density="full" />
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t px-5 py-3">
            <DialogClose render={<Button variant="outline" />}>ปิด</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
