import { getApiUrl } from '@/app/common/api-url'

/** ประเภทผลลัพธ์ KM */
export type KmResultType = 'system' | 'innovation'

export type KmSessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export type KmSessionItem = {
  id: string
  title: string
  description: string | null
  sessionDate: string
  fiscalYear: number | null
  status: string
  fileName: string | null
  hasReport?: boolean
  reportSource?: 'upload' | 'link'
  previewUrl?: string
  externalUrl?: string
  department: { id: string; name: string } | null
  facilitator: { id: string; name: string }
  resultsCount: number
}

export type KmResultItem = {
  id: string
  sessionId: string
  type: KmResultType
  title: string
  description: string | null
  imageUrl: string | null
  systemUrl: string | null
  year: number | null
  session?: { id: string; title: string; fiscalYear: number | null }
  author: { id: string; name: string }
}

export type KmInnovationItem = {
  id: string
  sessionId: string | null
  title: string
  innovationType: string | null
  description: string
  result: string | null
  year: number | null
  status: string
  session?: { id: string; title: string } | null
  author: { id: string; name: string }
}

export type KmSessionDetail = KmSessionItem & {
  results: Array<{
    id: string
    type: string
    title: string
    description: string | null
    imageUrl: string | null
    systemUrl: string | null
  }>
  innovations: Array<{
    id: string
    title: string
    innovationType: string | null
    description: string
    result: string | null
    year: number | null
  }>
}

export const KM_SESSION_STATUS: Record<string, { label: string; className: string }> = {
  planned: { label: 'วางแผน', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  in_progress: { label: 'กำลังดำเนินการ', className: 'border-amber-200 bg-amber-50 text-amber-900' },
  completed: { label: 'เสร็จสิ้น', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  cancelled: { label: 'ยกเลิก', className: 'border-rose-200 bg-rose-50 text-rose-800' },
}

export const KM_RESULT_TYPE: Record<KmResultType, { label: string; className: string }> = {
  system: { label: 'ระบบที่พัฒนา', className: 'border-sky-200 bg-sky-50 text-sky-800' },
  innovation: { label: 'นวัตกรรม (ผลลัพธ์)', className: 'border-teal-200 bg-teal-50 text-teal-800' },
}

/** โครงสร้างระบบ KM สำหรับแสดงในหน้า overview */
export const KM_SYSTEM_MODULES = [
  {
    id: 'sessions',
    title: 'รายงานการประชุม (KM Session)',
    description:
      'บันทึกแต่ละครั้งที่จัด KM — หัวข้อ วันที่ ผู้นำเสนอ สถานะ และไฟล์ PDF รายงานการประชุม',
    icon: 'meeting' as const,
  },
  {
    id: 'results',
    title: 'ผลลัพธ์จาก KM',
    description:
      'สิ่งที่ได้จากการประชุม — ระบบที่พัฒนา ลิงก์ใช้งาน หรือผลงานที่นำไปใช้ต่อ',
    icon: 'result' as const,
  },
  {
    id: 'systems',
    title: 'ระบบที่พัฒนา',
    description: 'ผลลัพธ์ประเภท system — แอป แดชบอร์ด หรือเครื่องมือดิจิทัลที่เกิดจาก KM',
    icon: 'system' as const,
  },
  {
    id: 'innovations',
    title: 'นวัตกรรม',
    description: 'นวัตกรรมด้านกระบวนการ บริการ หรือเทคโนโลยี พร้อมผลที่เกิดขึ้น',
    icon: 'innovation' as const,
  },
]

export function kmSessionHref(id: string) {
  return `/dashboard/km/sessions/${id}`
}

export function kmReportUrl(sessionId: string) {
  return `${getApiUrl()}/api/v1/km/sessions/${sessionId}/report`
}
