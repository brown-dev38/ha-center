import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export const HA_V6_SECTION_III_GROUP_LABELS: Record<string, string> = {
  'III-1': 'III-1 การเข้าถึงและเข้ารับบริการ (Access and Entry)',
  'III-2': 'III-2 การประเมินผู้ป่วย (Patient Assessment)',
  'III-3': 'III-3 การวางแผน (Planning)',
  'III-4': 'III-4 การดูแลผู้ป่วย (Patient Care Delivery)',
  'III-5': 'III-5 การให้ข้อมูลและการเสริมพลังแก่ผู้ป่วย/ครอบครัว',
  'III-6': 'III-6 การดูแลต่อเนื่อง (Continuity of Care)',
}

function sectionIIIDoc(
  order: number,
  subSection: string,
  title: string,
  docType: string,
  responsible: string,
  extra?: Partial<HaV6TrackedDocument>
): HaV6TrackedDocument {
  return {
    id: `section-iii-${order}`,
    sectionId: 'section-iii',
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

/** ตอนที่ III กระบวนการดูแลผู้ป่วย — 13 รายการ (III-1 ถึง III-6) */
export const HA_V6_SECTION_III_DOCUMENTS: HaV6TrackedDocument[] = [
  sectionIIIDoc(
    1,
    'III-1',
    'ระบบคัดกรอง (Triage) และการเข้าถึงบริการ',
    'ระบบงาน',
    'ศูนย์ลูกค้าสัมพันธ์'
  ),
  sectionIIIDoc(
    2,
    'III-1',
    'ระบบรับ-ส่งต่อผู้ป่วย (Referral In/Out)',
    'เอกสารหลัก',
    'ห้องฉุกเฉิน/OPD'
  ),
  sectionIIIDoc(
    3,
    'III-2',
    'แนวทางการประเมินผู้ป่วยแรกรับและซ้ำ',
    'เอกสารหลัก',
    'คณะกรรมการพยาบาล'
  ),
  sectionIIIDoc(
    4,
    'III-2',
    'การวินิจฉัยและการตรวจเพิ่มเติมที่เหมาะสม',
    'ระบบงาน',
    'คณะกรรมการพยาบาล'
  ),
  sectionIIIDoc(
    5,
    'III-3',
    'การวางแผนการดูแลผู้ป่วย (Care Plan/Care Map)',
    'เอกสารหลัก',
    'องค์กรแพทย์'
  ),
  sectionIIIDoc(
    6,
    'III-4',
    'แนวทางการดูแลผู้ป่วยทั่วไปและกลุ่มเสี่ยงสูง (High-risk)',
    'แผน',
    'หอผู้ป่วย'
  ),
  sectionIIIDoc(
    7,
    'III-4',
    'การดูแลผู้ป่วยผ่าตัดและการระงับความรู้สึก (Surgical/Anesthesia)',
    'นโยบาย',
    'องค์กรแพทย์'
  ),
  sectionIIIDoc(
    8,
    'III-4',
    'การดูแลผู้ป่วยวิกฤต (III-4.3ฎ / Critical Care / RRT)',
    'ระบบงาน',
    'คณะกรรมการยา'
  ),
  sectionIIIDoc(
    9,
    'III-4',
    'CPG / ERAS / Standing Order กลุ่มโรคสำคัญ',
    'ระบบงาน',
    'ทีมความปลอดภัย'
  ),
  sectionIIIDoc(
    10,
    'III-5',
    'การให้ข้อมูลผู้ป่วยและการขอความยินยอม (Informed Consent)',
    'ระบบงาน',
    'หอผู้ป่วยวิกฤต/ER',
    { edition6Status: 'ใหม่ ฉ.6', remarks: 'ตาม ฉ.6' }
  ),
  sectionIIIDoc(
    11,
    'III-5',
    'การให้ความรู้และเสริมพลังผู้ป่วย/ครอบครัว (Health Education)',
    'เอกสารหลัก',
    'คณะกรรมการพยาบาล'
  ),
  sectionIIIDoc(
    12,
    'III-6',
    'การวางแผนจำหน่าย (Discharge Planning) และ D/C Summary',
    'ระบบงาน',
    'จริยธรรมวิชาชีพ'
  ),
  sectionIIIDoc(
    13,
    'III-6',
    'ระบบดูแลต่อเนื่องและส่งต่อชุมชน (Continuity/Home Health)',
    'แผน',
    'ทีมส่งต่อผู้ป่วย'
  ),
]
