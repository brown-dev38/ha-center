import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export const HA_V6_SECTION_II_GROUP_LABELS: Record<string, string> = {
  'II-1': 'II-1 การบริหารงานคุณภาพ ความเสี่ยง และความปลอดภัย (Quality, Risk and Safety Management)',
  'II-2': 'II-2 การกำกับดูแลด้านวิชาชีพ (Professional Governance)',
  'II-3': 'II-3 สิ่งแวดล้อมในการดูแลผู้ป่วย/ผู้รับผลงาน (Environment of Care)',
  'II-4': 'II-4 การป้องกันและควบคุมการติดเชื้อ (Infection Prevention and Control)',
  'II-5': 'II-5 ระบบเวชระเบียน (Medical Records)',
  'II-6': 'II-6 ระบบการจัดการยา (Medication Management)',
  'II-7': 'II-7 การตรวจทดสอบเพื่อการวินิจฉัยโรค (Diagnostic Testing)',
  'II-8': 'II-8 การเฝ้าระวังโรคและภัยสุขภาพ (Surveillance)',
  'II-9': 'II-9 การทำงานกับชุมชน (Community Engagement)',
  'II-10': 'II-10 การดูแลผู้ป่วยโดยใช้เทคโนโลยีดิจิทัล (Digital Care) — บทใหม่ ฉ.6',
}

function sectionIIDoc(
  order: number,
  subSection: string,
  title: string,
  docType: string,
  responsible: string,
  extra?: Partial<HaV6TrackedDocument>
): HaV6TrackedDocument {
  return {
    id: `section-ii-${order}`,
    sectionId: 'section-ii',
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

/** ตอนที่ II ระบบงานสำคัญของโรงพยาบาล — 28 รายการ (II-1 ถึง II-10) */
export const HA_V6_SECTION_II_DOCUMENTS: HaV6TrackedDocument[] = [
  sectionIIDoc(
    1,
    'II-1',
    'ระบบบริหารความเสี่ยง (COSO ERM 2017) / Risk Register / Risk Profile',
    'นโยบาย',
    'ทีมนำคุณภาพ'
  ),
  sectionIIDoc(
    2,
    'II-1',
    'ระบบรายงานอุบัติการณ์ (Incident Report) และ Just Culture Policy',
    'ระบบงาน',
    'ทีมความเสี่ยง'
  ),
  sectionIIDoc(
    3,
    'II-1',
    'การวิเคราะห์สาเหตุราก (RCA) และ After Action Review',
    'ระบบงาน',
    'ทีมความปลอดภัย'
  ),
  sectionIIDoc(
    4,
    'II-1',
    'คู่มือบริหารความเสี่ยง (Risk Management Manual) / SOP',
    'ระบบงาน',
    'องค์กรแพทย์'
  ),
  sectionIIDoc(
    5,
    'II-2',
    'ระเบียบและมาตรฐานองค์กรแพทย์ (Medical Staff)',
    'รายงาน',
    'องค์กรแพทย์'
  ),
  sectionIIDoc(
    6,
    'II-2',
    'มาตรฐานการปฏิบัติการพยาบาล (Nursing/NQA)',
    'นโยบาย',
    'จริยธรรมวิชาชีพ'
  ),
  sectionIIDoc(
    7,
    'II-2',
    'การกำกับดูแลสหวิชาชีพอื่น ๆ',
    'นโยบาย',
    'วิศวกรรม/อาคาร'
  ),
  sectionIIDoc(
    8,
    'II-3',
    'แผนงานความปลอดภัยสิ่งแวดล้อม (ENV Program)',
    'ระบบงาน',
    'ความปลอดภัยอาคาร'
  ),
  sectionIIDoc(
    9,
    'II-3',
    'ความปลอดภัยอาคารสถานที่และระบบสาธารณูปโภค',
    'แผน',
    'ฝ่ายอำนวยการ'
  ),
  sectionIIDoc(
    10,
    'II-3',
    'การจัดการเครื่องมือแพทย์และการสอบเทียบ',
    'นโยบาย',
    'คณะกรรมการควบคุมการติดเชื้อ'
  ),
  sectionIIDoc(
    11,
    'II-3',
    'การจัดการของเสียและวัตถุอันตราย',
    'ระบบงาน',
    'คณะกรรมการควบคุมการติดเชื้อ'
  ),
  sectionIIDoc(
    12,
    'II-4',
    'แผนงานและโปรแกรม IC ประจำปี',
    'เอกสารหลัก',
    'คณะกรรมการควบคุมการติดเชื้อ'
  ),
  sectionIIDoc(
    13,
    'II-4',
    'ระบบเฝ้าระวังการติดเชื้อในโรงพยาบาล (Surveillance)',
    'นโยบาย',
    'ทีมสารสนเทศ'
  ),
  sectionIIDoc(
    14,
    'II-4',
    'ผลการเฝ้าระวังและมาตรการควบคุมการติดเชื้อ',
    'เอกสารหลัก',
    'ทีมเวชระเบียน'
  ),
  sectionIIDoc(
    15,
    'II-5',
    'ระบบบริหารจัดการเวชระเบียนและความปลอดภัยข้อมูล',
    'ระบบงาน',
    'ทีมเวชระเบียน'
  ),
  sectionIIDoc(
    16,
    'II-5',
    'การทบทวนความสมบูรณ์เวชระเบียน (MRA/Chart Review)',
    'นโยบาย',
    'คณะกรรมการยา'
  ),
  sectionIIDoc(
    17,
    'II-6',
    'โครงสร้างและบทบาท PTC (คณะกรรมการเภสัชกรรมและการบำบัด)',
    'ระบบงาน',
    'เภสัชกรรม'
  ),
  sectionIIDoc(
    18,
    'II-6',
    'ระบบยาและความปลอดภัยด้านยา (Medication Safety/HAD/LASA)',
    'ระบบงาน',
    'เภสัชกรรม'
  ),
  sectionIIDoc(
    19,
    'II-6',
    'การจัดการคลังยาและเวชภัณฑ์ (Inventory)',
    'ระบบงาน',
    'ห้องปฏิบัติการ'
  ),
  sectionIIDoc(
    20,
    'II-7',
    'มาตรฐานห้องปฏิบัติการและควบคุมคุณภาพ (Lab/QC/LA)',
    'ระบบงาน',
    'รังสีวิทยา'
  ),
  sectionIIDoc(
    21,
    'II-7',
    'มาตรฐานงานพยาธิวิทยาและรังสีวิทยา',
    'ระบบงาน',
    'ธนาคารเลือด',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'ตาม ฉ.6' }
  ),
  sectionIIDoc(
    22,
    'II-7',
    'ธนาคารเลือดและงานบริการโลหิต (II-7.3)',
    'ระบบงาน',
    'งานระบาดวิทยา'
  ),
  sectionIIDoc(
    23,
    'II-8',
    'ระบบเฝ้าระวังทางระบาดวิทยาและการสอบสวนโรค',
    'แผน',
    'งานระบาดวิทยา'
  ),
  sectionIIDoc(
    24,
    'II-8',
    'แผนตอบโต้ภาวะฉุกเฉินด้านสาธารณสุข (EOC / 7 Scenarios)',
    'รายงาน',
    'งานระบาดวิทยา'
  ),
  sectionIIDoc(
    25,
    'II-9',
    'แผนและกิจกรรมการทำงานร่วมกับชุมชน / สร้างเสริมสุขภาพ',
    'แผน',
    'เวชกรรมสังคม'
  ),
  sectionIIDoc(
    26,
    'II-10',
    'นโยบายและระบบการดูแลผู้ป่วยด้วยเทคโนโลยีดิจิทัล/AI',
    'นโยบาย',
    'ทีม IT/MedUP',
    { edition6Status: 'ใหม่ ฉ.6' }
  ),
  sectionIIDoc(
    27,
    'II-10',
    'ระบบการแพทย์ทางไกล (Telemedicine) และการดูแลผู้ป่วยที่บ้าน',
    'ระบบงาน',
    'ทีมสารสนเทศ',
    { edition6Status: 'ใหม่ ฉ.6' }
  ),
  sectionIIDoc(
    28,
    'II-10',
    'การกำกับดูแลความปลอดภัยและจริยธรรมการใช้ AI ทางคลินิก',
    'นโยบาย',
    'MedUP/องค์กรแพทย์',
    { edition6Status: 'ใหม่ ฉ.6' }
  ),
]
