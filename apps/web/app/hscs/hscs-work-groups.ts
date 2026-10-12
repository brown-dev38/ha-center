import type { HscsScopeOption } from '@/app/hscs/hscs-types'

/** กลุ่มงาน HSCS — ใช้ใน dropdown เลือกรูปแบบ Dashboard */
export const HSCS_WORK_GROUPS: HscsScopeOption[] = [
  { id: 'organization', label: 'ภาพรวมทั้งองค์กร' },
  { id: 'physical-therapy', label: 'งานกายภาพบำบัด' },
  { id: 'finance', label: 'งานการเงินและบัญชี' },
  { id: 'nursing-special-clinic', label: 'งานการพยาบาลคลินิกพิเศษ' },
  {
    id: 'nursing-infection-control',
    label: 'งานการพยาบาลด้านการควบคุมและป้องกันการติดเชื้อ',
  },
  { id: 'nursing-opd', label: 'งานการพยาบาลผู้ป่วยนอก' },
  { id: 'nursing-ward', label: 'งานการพยาบาลผู้ป่วยใน' },
  { id: 'nursing-icu', label: 'งานการพยาบาลผู้ป่วยวิกฤต' },
  { id: 'nursing-or-patient', label: 'งานการพยาบาลผู้ป่วยห้องผ่าตัด' },
  { id: 'nursing-er', label: 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉิน' },
  { id: 'nursing-anesthesia', label: 'งานการพยาบาลวิสัญญี' },
  { id: 'nursing-labor', label: 'งานการพยาบาลห้องคลอด' },
  { id: 'nursing-or', label: 'งานการพยาบาลห้องผ่าตัด' },
  {
    id: 'biomedical-engineering',
    label: 'งานโครงสร้างพื้นฐานและวิศวกรรมทางการแพทย์',
  },
  { id: 'general-admin', label: 'งานบริหารทั่วไป' },
  { id: 'primary-care', label: 'งานปฐมภูมิ' },
  { id: 'health-insurance', label: 'งานประกันสุขภาพ' },
  { id: 'planning-supply', label: 'งานแผนและพัสดุ' },
  {
    id: 'quality-development',
    label: 'งานพัฒนาคุณภาพบริการและมาตรฐาน',
  },
  { id: 'pharmacy', label: 'งานเภสัชกรรม' },
  { id: 'radiology', label: 'งานรังสีวิทยา' },
  { id: 'medical-records', label: 'งานเวชระเบียนและเวชสถิติ' },
  {
    id: 'it-digital-health',
    label: 'งานเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัลทางการแพทย์',
  },
  { id: 'medical-technology', label: 'เทคนิคการแพทย์' },
  { id: 'medicine', label: 'แพทย์' },
]

export type HscsWorkGroupId = (typeof HSCS_WORK_GROUPS)[number]['id']

export function getHscsWorkGroupLabel(scopeId: string): string {
  return HSCS_WORK_GROUPS.find((g) => g.id === scopeId)?.label ?? scopeId
}

/** ค่าปรับข้อมูลตัวอย่างต่อกลุ่มงาน (deterministic) */
export function getHscsWorkGroupFactors(scopeId: HscsWorkGroupId): {
  scoreFactor: number
  respondentScale: number
} {
  if (scopeId === 'organization') {
    return { scoreFactor: 1, respondentScale: 1 }
  }

  let hash = 0
  for (let i = 0; i < scopeId.length; i += 1) {
    hash = (hash * 31 + scopeId.charCodeAt(i)) % 1000
  }

  const scoreFactor = 0.88 + (hash % 24) / 100
  const respondentScale = 0.04 + (hash % 18) / 100

  return { scoreFactor, respondentScale }
}
