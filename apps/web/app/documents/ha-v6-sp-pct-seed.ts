import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export const HA_V6_SP_PCT_GROUP_LABELS: Record<string, string> = {
  SP: 'Service Profile (SP) — โปรไฟล์รายหน่วยงาน (Department Profiles)',
  PCT: 'PCT / Clinical Tracer — กลุ่มโรคและกลุ่มผู้ป่วยสำคัญ (Disease Groups and Key Patient Groups)',
}

function spPctDoc(
  order: number,
  group: 'SP' | 'PCT',
  title: string,
  docType: string,
  responsible: string,
  extra?: Partial<HaV6TrackedDocument>
): HaV6TrackedDocument {
  return {
    id: `sp-pct-${order}`,
    sectionId: 'sp-pct',
    order,
    standardCode: group,
    subSection: group,
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

/** Service Profile & Clinical Tracer — 11 รายการ */
export const HA_V6_SP_PCT_DOCUMENTS: HaV6TrackedDocument[] = [
  spPctDoc(1, 'SP', 'SP กลุ่มงานผู้ป่วยนอก (OPD)', 'Profile', 'หัวหน้า OPD'),
  spPctDoc(2, 'SP', 'SP กลุ่มงานผู้ป่วยใน (IPD/Ward)', 'Profile', 'หัวหน้าหอผู้ป่วย'),
  spPctDoc(3, 'SP', 'SP ห้องฉุกเฉิน (ER)', 'Profile', 'หัวหน้า ER'),
  spPctDoc(4, 'SP', 'SP ห้องผ่าตัดและวิสัญญี (OR/Anes)', 'Profile', 'หัวหน้า OR'),
  spPctDoc(5, 'SP', 'SP หอผู้ป่วยวิกฤต (ICU)', 'Profile', 'หัวหน้า ICU'),
  spPctDoc(
    6,
    'SP',
    'SP เภสัชกรรม/ห้องปฏิบัติการ/รังสีวิทยา/ธนาคารเลือด (Pharmacy/Lab/Radiology/Blood Bank)',
    'Profile',
    'หัวหน้าหน่วย'
  ),
  spPctDoc(
    7,
    'SP',
    'SP หน่วยสนับสนุน (จ่ายกลาง/โภชนาการ/ซักฟอก) (Support Units)',
    'Profile',
    'หัวหน้าหน่วย'
  ),
  spPctDoc(
    8,
    'PCT',
    'Clinical Tracer/CQS กลุ่มโรคสำคัญ (Sepsis, STEMI, Stroke, Trauma)',
    'Tracer',
    'PCT'
  ),
  spPctDoc(
    9,
    'PCT',
    'Clinical Tracer สาขาศัลยกรรมทางเดินปัสสาวะ (Urology) — URSL/TRUS-Bx',
    'Tracer',
    'PCT ศัลย์'
  ),
  spPctDoc(10, 'PCT', 'CPG/Care Map พร้อมตัวชี้วัดทางคลินิก', 'แนวทาง', 'PCT'),
  spPctDoc(
    11,
    'PCT',
    'ทะเบียนกลุ่มผู้ป่วยสำคัญและการทบทวนเวชระเบียนกลุ่มโรค',
    'รายงาน',
    'PCT'
  ),
]
