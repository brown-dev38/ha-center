import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

function sectionIVDoc(
  order: number,
  subSection: string,
  title: string,
  responsible: string,
  extra?: Partial<HaV6TrackedDocument>
): HaV6TrackedDocument {
  return {
    id: `section-iv-${order}`,
    sectionId: 'section-iv',
    order,
    standardCode: subSection,
    subSection,
    title,
    docType: 'ผลลัพธ์',
    responsible,
    status: 'not_started',
    progressPercent: 0,
    storageItems: [],
    storageLink: '',
    remarks: '',
    ...extra,
  }
}

/** ตอนที่ IV ผลการดำเนินการ — 6 รายการ (IV-1 ถึง IV-6, LeTCI) */
export const HA_V6_SECTION_IV_DOCUMENTS: HaV6TrackedDocument[] = [
  sectionIVDoc(1, 'IV-1', 'ผลด้านการดูแลสุขภาพ (Healthcare Results)', 'PCT/ทีมสารสนเทศ'),
  sectionIVDoc(
    2,
    'IV-2',
    'ผลด้านการมุ่งเน้นผู้ป่วยและผู้รับผลงาน (Patient/Customer-Focused)',
    'ศูนย์ลูกค้าสัมพันธ์'
  ),
  sectionIVDoc(3, 'IV-3', 'ผลด้านบุคลากร (Workforce Results)', 'งานบุคคล'),
  sectionIVDoc(
    4,
    'IV-4',
    'ผลด้านการนำและการกำกับดูแล (Leadership & Governance)',
    'ทีมนำ'
  ),
  sectionIVDoc(
    5,
    'IV-5',
    'ผลด้านระบบงานสำคัญ (Key Work Process Effectiveness)',
    'ทีมนำคุณภาพ'
  ),
  sectionIVDoc(6, 'IV-6', 'ผลด้านการเงิน (Financial Results / FSR)', 'งานการเงิน'),
]
