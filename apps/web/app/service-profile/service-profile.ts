import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileCheck,
  HeartPulse,
  Layers,
  Lightbulb,
  Shield,
  Target,
  Users,
} from 'lucide-react'

export const SP_META = {
  title: 'Service Profile',
  titleTh: 'โปรไฟล์บริการ',
  hospital: 'โรงพยาบาลมหาวิทยาลัยพะเยา',
  unit: 'ศูนย์ประสานงาน Hospital Accreditation (HA)',
  tagline:
    'บริหารจัดการคุณภาพแบบองค์กร ',
  lastUpdated: 'พ.ศ. 2568',
} as const

export type ValuePillar = {
  title: string
  description: string
  icon: LucideIcon
}

export const VALUE_PILLARS: ValuePillar[] = [
  {
    title: 'มุ่งผู้รับบริการ',
    description: 'ออกแบบบริการจากความต้องการของผู้ป่วย บุคลากร และหน่วยงานภายใน',
    icon: HeartPulse,
  },

  {
    title: 'ขับเคลื่อนด้วยหลักฐาน',
    description: 'เชื่อมโยงมาตรฐาน HA ตัวชี้วัด และผลงาน CQI/KM เป็นข้อมูลเดียว',
    icon: BarChart3,
  },
  {
    title: 'ประสานทั้งระบบ',
    description: 'ทีมนำคุณภาพและศูนย์ HA ทำงานร่วมกันแบบ end-to-end',
    icon: Layers,
  },
]

export type ServiceScope = 'hospital' | 'leadership'

export type ServiceCatalogItem = {
  id: string
  scope: ServiceScope
  department: string
  departmentCode: string
  title: string
  summary: string
  deliverables: string[]
  standardRef?: string
  icon: LucideIcon
  highlight?: boolean
}

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'ha-coord',
    scope: 'hospital',
    department: 'ศูนย์ประสานงาน HA',
    departmentCode: 'HA',
    title: 'ประสานมาตรฐาน HA ทั้งโรงพยาบาล',
    summary: 'ให้คำปรึกษา แผนปฏิบัติ และติดตามความพร้อมรับการประเมิน',
    deliverables: ['แผนปฏิบัติ HA', 'รายงานความพร้อม', 'ชุดหลักฐานแนวโน้ม'],
    standardRef: 'HA องค์กร / ผู้นำองค์กร',
    icon: Shield,
    highlight: true,
  },
  {
    id: 'qa-dev',
    scope: 'hospital',
    department: 'งานพัฒนาคุณภาพ',
    departmentCode: 'QA',
    title: 'พัฒนาระบบคุณภาพและ CQI',
    summary: 'สนับสนุนโครงการปรับปรุง รางวัลคุณภาพ และการเรียนรู้',
    deliverables: ['คู่มือ PDCA', 'ที่ปรึกษาโครงการ', 'นำเสนอผลงาน'],
    standardRef: 'CQI / การมีส่วนร่วม',
    icon: ClipboardCheck,
  },
  {
    id: 'doc-std',
    scope: 'hospital',
    department: 'ศูนย์ HA',
    departmentCode: 'HA',
    title: 'จัดการเอกสารมาตรฐาน',
    summary: 'คลังเอกสาร HA แบบหมวดหมู่ ควบคุมเวอร์ชัน และสิทธิ์การเข้าถึง',
    deliverables: ['อัปโหลด/ค้นหา', 'แจ้งเตือนเวอร์ชัน', 'รายงานการใช้งาน'],
    standardRef: 'เอกสารและระเบียบ',
    icon: FileCheck,
  },
  {
    id: 'elearn',
    scope: 'hospital',
    department: 'ศูนย์ HA',
    departmentCode: 'HA',
    title: 'อบรมออนไลน์ HA พื้นฐาน',
    summary: 'หลักสูตรสำหรับบุคลากรทุกสายงาน — เรียน ทดสอบ ใบรับรอง',
    deliverables: ['บทเรียน', 'แบบทดสอบ', 'ใบรับรองดิจิทัล'],
    standardRef: 'ทรัพยากรมนุษย์',
    icon: Award,
  },
  {
    id: 'kpi',
    scope: 'hospital',
    department: 'งานพัฒนาคุณภาพ',
    departmentCode: 'QA',
    title: 'ติดตามตัวชี้วัด KPI',
    summary: 'เชื่อมระบบ KPI โรงพยาบาล สรุปผลและรายงานทีมนำ',
    deliverables: ['Dashboard', 'รายงานรายไตรมาส', 'การแจ้งเตือนค่าเตือน'],
    standardRef: 'ตัวชี้วัดและผลลัพธ์',
    icon: BarChart3,
  },

  {
    id: 'nursing-qa',
    scope: 'hospital',
    department: 'งานการพยาบาล',
    departmentCode: 'NUR',
    title: 'คุณภาพการพยาบาล',
    summary: 'ประสานมาตรฐานทางคลินิกและความปลอดภัยผู้ป่วย',
    deliverables: ['แผนปฏิบัติหน่วยงาน', 'CQI คลินิก', 'KM การพยาบาล'],
    standardRef: 'ความปลอดภัยผู้ป่วย',
    icon: HeartPulse,
  },

  {
    id: 'lead-meeting',
    scope: 'leadership',
    department: 'ทีมนำคุณภาพ',
    departmentCode: 'QTL',
    title: 'ประชุมทีมนำคุณภาพ',
    summary: 'จัดการวาระ รายงาน PDF และบันทึก KM หลังการประชุม',
    deliverables: ['นัดประชุม', 'รายงาน PDF', 'KM Session'],
    standardRef: 'การนำองค์กร',
    icon: Users,
    highlight: true,
  },
  {
    id: 'lead-orders',
    scope: 'leadership',
    department: 'ทีมนำคุณภาพ',
    departmentCode: 'QTL',
    title: 'คำสั่งและโครงสร้างคณะกรรมการ',
    summary: 'เอกสารคำสั่งแต่งตั้ง บทบาท และสายการบังคับบัญชาคุณภาพ',
    deliverables: ['คำสั่งแต่งตั้ง', 'โครงสร้างองค์กร', 'อัปเดตรายชื่อ'],
    icon: Building2,
  },
  {
    id: 'lead-indicators',
    scope: 'leadership',
    department: 'ทีมนำคุณภาพ',
    departmentCode: 'QTL',
    title: 'รายงานตัวชี้วัดทีมนำ',
    summary: 'สรุป KPI ที่ทีมนำติดตามเป็นพิเศษ — แนวโน้มและมาตการ',
    deliverables: ['รายงานรายเดือน', 'วิเคราะห์ช่องว่าง', 'มติที่ประชุม'],
    standardRef: 'ตัวชี้วัดระดับผู้บริหาร',
    icon: Target,
  },
  {
    id: 'lead-km',
    scope: 'leadership',
    department: 'ทีมนำคุณภาพ',
    departmentCode: 'QTL',
    title: 'KM จากการประชุมทีมนำ',
    summary: 'ถอดบทเรียน นวัตกรรม และผลลัพธ์จากการประชุมทีมนำคุณภาพ',
    deliverables: ['KM Report', 'นวัตกรรม', 'เผยแพร่ภายใน'],
    icon: Lightbulb,
  },
]

export type GovernanceNode = {
  level: number
  title: string
  role: string
  focus: string
}

export const GOVERNANCE_STRUCTURE: GovernanceNode[] = [
  {
    level: 1,
    title: 'ผู้บริหารสูงสุด',
    role: 'นโยบายและทิศทาง HA',
    focus: 'อนุมัติแผน ทรัพยากร และเป้าหมายองค์กร',
  },
  {
    level: 2,
    title: 'คณะกรรมการคุณภาพ / ทีมนำ',
    role: 'กำกับและตัดสินใจ',
    focus: 'มติประชุม ตัวชี้วัดระดับผู้บริหาร รางวัล CQI',
  },
  {
    level: 3,
    title: 'ศูนย์ประสานงาน HA',
    role: 'ประสานและขับเคลื่อน',
    focus: 'มาตรฐาน เอกสาร อบรม ระบบดิจิทัล',
  },
  {
    level: 4,
    title: 'ทีมคุณภาพหน่วยงาน',
    role: 'ดำเนินการและรายงาน',
    focus: 'CQI หน่วยงาน KM ข้อมูลหลักฐาน',
  },
]

export type StandardPillar = {
  id: string
  code: string
  title: string
  description: string
}

export const HA_STANDARD_PILLARS: StandardPillar[] = [
  {
    id: 'lead',
    code: 'L',
    title: 'การนำองค์กร',
    description: 'ผู้บริหารและทีมนำกำหนดทิศทาง สื่อสาร และติดตามผล',
  },
  {
    id: 'quality',
    code: 'Q',
    title: 'ระบบคุณภาพ',
    description: 'นโยบาย แผน รีวิว และการปรับปรุงอย่างต่อเนื่อง',
  },
  {
    id: 'safety',
    code: 'S',
    title: 'ความปลอดภัย',
    description: 'ความเสี่ยง การรายงานเหตุการณ์ และการเรียนรู้',
  },
  {
    id: 'people',
    code: 'P',
    title: 'ทรัพยากรมนุษย์',
    description: 'สมรรถนะ อบรม และการมีส่วนร่วมของบุคลากร',
  },
  {
    id: 'outcome',
    code: 'O',
    title: 'ผลลัพธ์และตัวชี้วัด',
    description: 'KPI คลินิกและสนับสนุน — ติดตามแนวโน้ม',
  },
]

export type JourneyStep = {
  step: number
  title: string
  description: string
  duration?: string
}

export const SERVICE_JOURNEY: JourneyStep[] = [
  {
    step: 1,
    title: 'รับคำขอ / ปรึกษา',
    description: 'หน่วยงานติดต่อผ่านฟอร์ม อีเมล หรือนัดประชุม',
    duration: 'วันที่ 0',
  },
  {
    step: 2,
    title: 'วิเคราะห์และวางแผน',
    description: 'ทีม HA ประเมินบริบท มาตรฐานที่เกี่ยวข้อง และกำหนดแผน',
    duration: '1–3 วันทำการ',
  },
  {
    step: 3,
    title: 'ดำเนินการสนับสนุน',
    description: 'ให้คำปรึกษา เอกสาร อบรม หรือเชื่อมระบบดิจิทัล',
    duration: 'ตามขอบเขต',
  },
  {
    step: 4,
    title: 'ติดตามและรายงาน',
    description: 'ตัวชี้วัด รายงานทีมนำ และ KM หลังดำเนินการ',
    duration: 'รายไตรมาส',
  },
  {
    step: 5,
    title: 'ทบทวนและพัฒนาต่อ',
    description: 'PDCA ปิดวงจร — ปรับ Service Profile และแนวปฏิบัติ',
    duration: 'ต่อเนื่อง',
  },
]

export type MetricHighlight = {
  label: string
  value: string
  note: string
}

export const METRIC_HIGHLIGHTS: MetricHighlight[] = [
  { label: 'หน่วยงานในเครือข่าย HA',    value: '5+', note: 'แผนกหลักและสายงานสนับสนุน' },
  { label: 'โครงการ CQI ติดตาม',      value: '5', note: 'ในระบบ HA Center' },
  { label: 'หลักสูตร E-Learning',      value: '1+', note: 'พร้อมใบรับรอง' },
  { label: 'KM Session', value: '1+', note: 'บันทึกความรู้ทีมนำ' },
]



export type RelatedResource = {
  label: string
  href: string
  description: string
}

export const RELATED_RESOURCES: RelatedResource[] = [
  {
    label: 'คำสั่งคณกรรมการทีมนำ',
    href: '/dashboard/quality-team/orders',
    description: 'โครงสร้างและคำสั่งแต่งตั้ง',
  },
  {
    label: 'รายงานประชุมทีมนำ (PDF)',
    href: '/dashboard/quality-team/meeting-reports',
    description: 'เอกสารหลังการประชุม',
  },
  {
    label: 'ตัวชี้วัดทีมนำ',
    href: '/dashboard/quality-team/indicator-reports',
    description: 'รายงาน KPI สำหรับทีมนำ',
  },
  {
    label: 'ติดต่อศูนย์ HA',
    href: '/dashboard/contact',
    description: 'ส่งคำขอปรึกษา',
  },
]

export function catalogByScope(scope: ServiceScope) {
  return SERVICE_CATALOG.filter((s) => s.scope === scope)
}
