import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export const HA_V6_SECTION_I_GROUP_LABELS: Record<string, string> = {
  'I-1': 'I-1 การนำ (Leadership)',
  'I-2': 'I-2 กลยุทธ์ (Strategy)',
  'I-3': 'I-3 ผู้ป่วย/ผู้รับผลงาน (Patient/Customer)',
  'I-4': 'I-4 การวัด การวิเคราะห์ และการจัดการความรู้',
  'I-5': 'I-5 บุคลากร (Workforce) — ปรับปรุงเนื้อหาใน ฉ.6',
  'I-6': 'I-6 การปฏิบัติการ (Operation)',
}

function sectionIDoc(
  order: number,
  subSection: string,
  title: string,
  docType: string,
  responsible: string,
  extra?: Partial<HaV6TrackedDocument>
): HaV6TrackedDocument {
  return {
    id: `section-i-${order}`,
    sectionId: 'section-i',
    order,
    standardCode: subSection,
    subSection,
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

/** ตอนที่ I ภาพรวมของการบริหารองค์กร — 20 รายการ */
export const HA_V6_SECTION_I_DOCUMENTS: HaV6TrackedDocument[] = [
  sectionIDoc(
    1,
    'I-1',
    'การกำหนดทิศทาง วิสัยทัศน์ พันธกิจ ค่านิยม จริยธรรม (I-1.1ก)',
    'นโยบาย',
    'ทีมนำ'
  ),
  sectionIDoc(2, 'I-1', 'ระบบการสื่อสารและการสร้างความผูกพัน (I-1.1ข)', 'บันทึก', 'ทีมนำ'),
  sectionIDoc(
    3,
    'I-1',
    'ระบบธรรมาภิบาลและการกำกับดูแลกิจการ/คลินิก (Governance)',
    'ระบบงาน',
    'ทีมนำ'
  ),
  sectionIDoc(
    4,
    'I-1',
    'การจัดบริการสุขภาพเพื่อความยั่งยืนและทำประโยชน์ให้สังคม (I-1.2ค)',
    'นโยบาย',
    'ทีมนำ',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'Sustainability' }
  ),
  sectionIDoc(
    5,
    'I-2',
    'กระบวนการจัดทำแผนกลยุทธ์ (SWOT/SOAR/TOWS/Foresight)',
    'เอกสารหลัก',
    'ทีมยุทธศาสตร์'
  ),
  sectionIDoc(
    6,
    'I-2',
    'แผนกลยุทธ์และแผนปฏิบัติการ (SO/Action Plan/Roadmap)',
    'แผน',
    'ทีมยุทธศาสตร์'
  ),
  sectionIDoc(
    7,
    'I-2',
    'การถ่ายทอดกลยุทธ์สู่การปฏิบัติและการติดตาม (KPI Cascade)',
    'ระบบงาน',
    'ทีมยุทธศาสตร์'
  ),
  sectionIDoc(
    8,
    'I-3',
    'การรับฟังเสียงผู้ป่วย (VOC) / สำรวจความพึงพอใจ',
    'ระบบงาน',
    'ศูนย์ลูกค้าสัมพันธ์'
  ),
  sectionIDoc(9, 'I-3', 'ระบบจัดการข้อร้องเรียนและข้อเสนอแนะ', 'ระบบงาน', 'ศูนย์ลูกค้าสัมพันธ์'),
  sectionIDoc(
    10,
    'I-3',
    'การประกาศและคุ้มครองสิทธิผู้ป่วยและผู้รับบริการ',
    'นโยบาย',
    'องค์กรแพทย์'
  ),
  sectionIDoc(
    11,
    'I-4',
    'ระบบสารสนเทศและการจัดการข้อมูล (HAIT / Data Governance)',
    'ระบบงาน',
    'ทีม IT / MedUP'
  ),
  sectionIDoc(
    12,
    'I-4',
    'การจัดการความมั่นคงปลอดภัยสารสนเทศและคุ้มครองข้อมูลส่วนบุคคล (I-4.2ค / PDPA)',
    'ระบบงาน',
    'ทีม IT / DPO',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'PDPA' }
  ),
  sectionIDoc(
    13,
    'I-4',
    'การวิเคราะห์/ทบทวนผลการดำเนินงาน และการจัดการความรู้ (KM)',
    'รายงาน',
    'ทีม KM'
  ),
  sectionIDoc(14, 'I-5', 'แผนอัตรากำลังและการวางแผนบุคลากร', 'แผน', 'งานบุคคล'),
  sectionIDoc(
    15,
    'I-5',
    'การพัฒนาบุคลากร (HRD/IDP/Competency/THPSF)',
    'แผน',
    'งานบุคคล'
  ),
  sectionIDoc(
    16,
    'I-5',
    'การสนับสนุนและสร้างความผูกพันของบุคลากร (Workforce Support)',
    'ระบบงาน',
    'งานบุคคล',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'ปรับปรุง ฉ.6' }
  ),
  sectionIDoc(
    17,
    'I-5',
    'ความปลอดภัยและอาชีวอนามัยบุคลากร (Personnel Safety / HSCS)',
    'ระบบงาน',
    'อาชีวอนามัย'
  ),
  sectionIDoc(
    18,
    'I-6',
    'การออกแบบระบบงานและกระบวนการหลัก (SIPOC/COPIS)',
    'เอกสารหลัก',
    'ทีมนำ'
  ),
  sectionIDoc(19, 'I-6', 'การบริหารความต่อเนื่องทางธุรกิจ (BCP/4R)', 'แผน', 'ทีมความเสี่ยง'),
  sectionIDoc(
    20,
    'I-6',
    'การจัดการห่วงโซ่อุปทานและการจัดซื้อ (Supply Chain/Lean)',
    'ระบบงาน',
    'พัสดุ/เภสัช'
  ),
]
