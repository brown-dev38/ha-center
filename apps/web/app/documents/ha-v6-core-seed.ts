import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

function coreDoc(
  order: number,
  title: string,
  docType: string,
  responsible: string,
  extra?: Partial<HaV6TrackedDocument>
): HaV6TrackedDocument {
  return {
    id: `core-${order}`,
    sectionId: 'core',
    order,
    standardCode: 'CORE',
    title,
    docType,
    responsible,
    status: 'not_started',
    progressPercent: 0,
    storageItems: [],
    storageLink: '',
    remarks: '',
    ...extra,
  }
}

/** เอกสารแกนหลักระดับองค์กร 11 ฉบับ */
export const HA_V6_CORE_DOCUMENTS: HaV6TrackedDocument[] = [
  coreDoc(
    1,
    'Hospital Profile (HP) — บริบท พันธกิจ วิสัยทัศน์ ค่านิยม MEDUP',
    'เอกสารหลัก',
    'ทีมนำ / ผอ.รพ.',
    { remarks: 'อัปเดตทุกปี' }
  ),
  coreDoc(
    2,
    'Self Assessment Report (SAR) ตอนที่ I–IV — เขียนด้วยระบบ 3P-DALI',
    'รายงาน',
    'ทีมนำคุณภาพ'
  ),
  coreDoc(
    3,
    'HA Scoring ทุกระบบ (54 บทกระบวนการ + 6 บทผลลัพธ์ = 60 บท) 5 ระดับ',
    'รายงาน',
    'ทีมนำคุณภาพ',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'ครบ ฉ.6' }
  ),
  coreDoc(
    4,
    'เอกสารบทสรุปที่จำเป็นต่อความปลอดภัย (Essential Criteria for Safety)',
    'รายงาน',
    'ทีมสวพ.ปลอดภัย',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'ตรงตามประกาศ' }
  ),
  coreDoc(5, 'แผนกลยุทธ์โรงพยาบาล / Strategy Map / House Model', 'แผน', 'ทีมยุทธศาสตร์'),
  coreDoc(6, 'แผนพัฒนาคุณภาพประจำปี (Quality Improvement Plan)', 'แผน', 'ทีมนำคุณภาพ'),
  coreDoc(
    7,
    'Patient Safety Goals — 3P Safety (Patient-Personnel-People) พร้อมผลลัพธ์',
    'รายงาน',
    'ทีมสวพ.ปลอดภัย'
  ),
  coreDoc(8, 'รายงานตัวชี้วัดที่สำคัญ (KPI Dashboard / LeTCI)', 'ผลลัพธ์', 'ทีมสารสนเทศ'),
  coreDoc(
    9,
    'คำสั่งแต่งตั้งคณะกรรมการคุณภาพ / ทีมนำ / ทีมคร่อมสายงาน',
    'คำสั่ง',
    'งานธุรการ'
  ),
  coreDoc(10, 'ผังโครงสร้างองค์กร (Organization Chart)', 'เอกสารหลัก', 'งานบุคคล'),
  coreDoc(
    11,
    'บันทึกผลการเยี่ยมสำรวจครั้งก่อน + แผนพัฒนา (IFI) ถ้ามี',
    'รายงาน',
    'ทีมนำคุณภาพ'
  ),
]
