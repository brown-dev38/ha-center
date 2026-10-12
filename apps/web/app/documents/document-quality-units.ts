export const QUALITY_UNIT_GROUPS = ['หน่วยงาน', 'ทีมคร่อมสายงาน'] as const

export type QualityUnitGroup = (typeof QUALITY_UNIT_GROUPS)[number]

export type QualityDocumentUnit = {
  id: string
  order: number
  code: string
  name: string
  group: QualityUnitGroup
}

export const DEFAULT_QUALITY_DOCUMENT_UNITS: QualityDocumentUnit[] = [
  {
    id: 'qu-it',
    order: 1,
    code: 'IT',
    name: 'งานเทคโนโลยีสารสนเทศดิจิทัลและนวัตกรรมทางการแพทย์',
    group: 'หน่วยงาน',
  },
  {
    id: 'qu-im',
    order: 2,
    code: 'IM',
    name: 'คณะกรรมการพัฒนาระบบคุณภาพสารสนเทศ',
    group: 'ทีมคร่อมสายงาน',
  },
  { id: 'qu-uph', order: 3, code: 'UPH', name: 'ทุกหน่วยงาน', group: 'หน่วยงาน' },
  { id: 'qu-scn', order: 4, code: 'SCN', name: 'งานการพยาบาลคลินิกพิเศษ', group: 'หน่วยงาน' },
  { id: 'qu-che', order: 5, code: 'CHE', name: 'ศูนย์ตรวจสุขภาพ', group: 'หน่วยงาน' },
  { id: 'qu-tra', order: 6, code: 'TRA', name: 'หน่วยบริการเคลื่อนย้ายผู้ป่วย', group: 'หน่วยงาน' },
  { id: 'qu-pmr', order: 7, code: 'PMR', name: 'หน่วยเวชกรรมฟื้นฟู', group: 'หน่วยงาน' },
  { id: 'qu-com', order: 8, code: 'COM', name: 'งานอนามัยชุมชนและสุขศึกษา', group: 'หน่วยงาน' },
  {
    id: 'qu-occ',
    order: 9,
    code: 'OCC',
    name: 'งานเวชกรรมสังคม อาชีวอนามัยสิ่งแวดล้อม',
    group: 'หน่วยงาน',
  },
  { id: 'qu-orn', order: 10, code: 'ORN', name: 'งานการแพทย์แผนตะวันออก', group: 'หน่วยงาน' },
]
