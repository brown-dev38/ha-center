/** โครงสร้างและป้ายกำกับ CQI — สอดคล้อง API */

export type CqiDepartment = {
  id: string
  code: string
  name: string
}

export type CqiListItem = {
  id: string
  title: string
  year: number | null
  status: string
  isOutstanding: boolean
  awardName: string | null
  department: CqiDepartment | null
  owner: { id: string; name: string }
}

export type CqiAward = {
  id: string
  projectId: string
  awardName: string
  awardLevel: string | null
  awardedAt: string
  description: string | null
}

export type CqiDetail = {
  id: string
  title: string
  description: string | null
  department: CqiDepartment | null
  year: number | null
  status: string
  isOutstanding: boolean
  awardName: string | null
  owner: { id: string; name: string; email?: string }
  pdca: {
    plan: string | null
    do: string | null
    check: string | null
    act: string | null
  }
  awards: CqiAward[]
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export type CqiDeptSummary = {
  department: CqiDepartment
  total: number
  completed: number
  outstanding: number
}

export type CqiOutstandingGroup = {
  year: number | null
  projects: CqiListItem[]
}

export const CQI_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'กำลังดำเนินการ', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  completed: { label: 'เสร็จสิ้น', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  draft: { label: 'ร่าง', className: 'border-amber-200 bg-amber-50 text-amber-900' },
  on_hold: { label: 'พักชั่วคราว', className: 'border-slate-200 bg-slate-50 text-slate-700' },
}

/** ขั้นตอน PDCA สำหรับแสดงรายละเอียด */
export const CQI_PDCA_PHASES = [
  {
    key: 'plan' as const,
    step: 1,
    label: 'Plan',
    labelTh: 'วางแผน',
    subtitle: 'กำหนดปัญหาและแนวทาง',
    field: 'plan' as const,
    accent: 'from-sky-500/15 to-sky-500/5',
    border: 'border-sky-200/80',
    dot: 'bg-sky-600',
  },
  {
    key: 'do' as const,
    step: 2,
    label: 'Do',
    labelTh: 'การดำเนินการ',
    subtitle: 'ลงมือปรับปรุงตามแผน',
    field: 'do' as const,
    accent: 'from-primary/15 to-primary/5',
    border: 'border-primary/25',
    dot: 'bg-primary',
  },
  {
    key: 'check' as const,
    step: 3,
    label: 'Check',
    labelTh: 'ผลลัพธ์',
    subtitle: 'วัดผลและประเมินผลกระทบ',
    field: 'check' as const,
    accent: 'from-ha-green/20 to-ha-green/5',
    border: 'border-teal-200/80',
    dot: 'bg-teal-600',
  },
  {
    key: 'act' as const,
    step: 4,
    label: 'Act',
    labelTh: 'ปรับปรุงต่อเนื่อง',
    subtitle: 'มาตรฐานใหม่และขยายผล',
    field: 'act' as const,
    accent: 'from-amber-500/15 to-amber-500/5',
    border: 'border-amber-200/80',
    dot: 'bg-amber-500',
  },
]

export const CQI_SYSTEM_OVERVIEW = [
  {
    title: 'รายการตามหน่วยงาน',
    description: 'สรุปจำนวนโครงการ CQI แยกตามแผนก — คลิกเพื่อดูผลงานในหน่วยงาน',
  },
  {
    title: 'รายละเอียดผลงาน',
    description: 'ชื่อผลงาน การดำเนินการ (PDCA) ผลลัพธ์ และรางวัลผลงานโดดเด่น',
  },
  {
    title: 'ผลงานได้รับรางวัล',
    description: 'คัดกรองโครงการ isOutstanding และประวัติรางวัล (CqiAward)',
  },
]

export function cqiDetailHref(id: string) {
  return `/dashboard/cqi/${id}`
}

export function cqiDeptProgress(completed: number, total: number) {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}

export function splitCqiParagraphs(text: string | null | undefined): string[] {
  if (!text?.trim()) return []
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}
