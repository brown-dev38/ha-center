import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react'

export const HA_CONTACT = {
  name: 'ศูนย์ประสานงาน Hospital Accreditation (HA)',
  hospital: 'โรงพยาบาลมหาวิทยาลัยพะเยา',
  tagline: 'พันธมิตรด้านคุณภาพ — ประสาน สนับสนุน และขับเคลื่อน HA ทั้งองค์กร',
  phone: '054-466-888 ต่อ 2201',
  phoneHref: 'tel:+6654466888,2201',
  email: 'ha.center@up.ac.th',
  lineId: '@hacenter.up',
  lineUrl: 'https://line.me/R/ti/p/@hacenter.up',
  location: 'อาคารศูนย์ HA ชั้น 2 โรงพยาบาลมหาวิทยาลัยพะเยา',
  mapUrl: 'https://www.google.com/maps/search/University+of+Phayao+Hospital',
  hours: 'จันทร์ – ศุกร์ 08:30 – 16:30 น.',
  responseNote: 'ทีมงานตอบกลับภายใน 1–2 วันทำการ (กรณีเร่งด่วนโปรดระบุในฟอร์ม)',
} as const

export type ContactChannel = {
  id: string
  title: string
  description: string
  value: string
  href?: string
  icon: LucideIcon
  accent: 'primary' | 'teal' | 'neutral'
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: 'phone',
    title: 'โทรศัพท์',
    description: 'สายด่วนคุณภาพและการนัดหมาย',
    value: HA_CONTACT.phone,
    href: HA_CONTACT.phoneHref,
    icon: Phone,
    accent: 'primary',
  },
  {
    id: 'email',
    title: 'อีเมล',
    description: 'เอกสาร คำถาม และการประสานงาน',
    value: HA_CONTACT.email,
    href: `mailto:${HA_CONTACT.email}`,
    icon: Mail,
    accent: 'teal',
  },
  {
    id: 'line',
    title: 'LINE Official',
    description: 'แจ้งเรื่องด่วนและติดตามสถานะ',
    value: HA_CONTACT.lineId,
    href: HA_CONTACT.lineUrl,
    icon: MessageCircle,
    accent: 'teal',
  },
  {
    id: 'visit',
    title: 'พบที่ศูนย์ HA',
    description: HA_CONTACT.hours,
    value: HA_CONTACT.location,
    href: HA_CONTACT.mapUrl,
    icon: MapPin,
    accent: 'neutral',
  },
]

export type ConsultTopic = {
  value: string
  label: string
}

export const CONSULT_TOPICS: ConsultTopic[] = [
  { value: 'ha-general', label: 'คำปรึกษา HA / มาตรฐานโรงพยาบาล' },
  { value: 'cqi', label: 'โครงการ CQI / PDCA' },
  { value: 'km', label: 'KM / นวัตกรรมและบทเรียน' },
  { value: 'documents', label: 'เอกสารคุณภาพและแนวปฏิบัติ' },
  { value: 'indicators', label: 'ตัวชี้วัด KPI' },
  { value: 'meeting', label: 'นัดประชุม / ห้องประชุม' },
  { value: 'elearning', label: 'หลักสูตร E-Learning HA' },
  { value: 'other', label: 'อื่นๆ' },
]

export type ServiceOffering = {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
}

export const SERVICE_OFFERINGS: ServiceOffering[] = [
  {
    id: 'cqi',
    title: 'ที่ปรึกษา CQI',
    description: 'ออกแบบวงจร PDCA จัดทำเอกสาร และเตรียมผลงานรางวัลคุณภาพ',
    href: '/dashboard/cqi',
    icon: ClipboardCheck,
  },
  {
    id: 'km',
    title: 'KM & นวัตกรรม',
    description: 'บันทึกความรู้จากการประชุม สรุป KM Session และเผยแพร่ผลงาน',
    href: '/dashboard/km',
    icon: Lightbulb,
  },
  {
    id: 'documents',
    title: 'เอกสารมาตรฐาน',
    description: 'ค้นหา อัปโหลด และจัดการเอกสาร HA ตามหมวดหมู่',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    id: 'indicators',
    title: 'ตัวชี้วัด KPI',
    description: 'เชื่อมโยงข้อมูลตัวชี้วัดและแนวทางรายงานผล',
    href: '/dashboard/indicators',
    icon: BarChart3,
  },
  {
    id: 'meetings',
    title: 'นัดประชุมคุณภาพ',
    description: 'จองห้องประชุม เชิญผู้เข้าร่วม และติดตามสถานะ',
    href: '/dashboard/meetings',
    icon: CalendarDays,
  },
  {
    id: 'elearning',
    title: 'อบรมออนไลน์',
    description: 'หลักสูตร HA พื้นฐาน แบบทดสอบ และใบรับรอง',
    href: '/dashboard/elearning',
    icon: GraduationCap,
  },
]

export type TeamContact = {
  role: string
  name: string
  detail: string
}

export const TEAM_CONTACTS: TeamContact[] = [
  {
    role: 'หัวหน้าศูนย์ HA',
    name: 'ทีมนำคุณภาพ รพ.ม.พ.',
    detail: 'กำกับทิศทางมาตรฐานและประสานทุกหน่วยงาน',
  },
  {
    role: 'ผู้จัดการคุณภาพ',
    name: 'QA Manager',
    detail: 'CQI · ตัวชี้วัด · การเตรียมรับการประเมิน',
  },
  {
    role: 'เจ้าหน้าที่ประสานงาน',
    name: 'HA Coordination',
    detail: 'เอกสาร · KM · นัดหมาย · ช่องทางติดต่อ',
  },
]

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export const CONTACT_FAQ: FaqItem[] = [
  {
    id: 'who',
    question: 'ใครควรติดต่อศูนย์ HA?',
    answer:
      'หัวหน้าหน่วยงาน ทีมคุณภาพ ผู้รับผิดชอบ CQI/KPI และบุคลากรที่ต้องการคำแนะนำด้านมาตรฐาน HA โรงพยาบาล สามารถปรึกษาได้ทุกแผนก',
  },
  {
    id: 'urgent',
    question: 'มีเรื่องเร่งด่วนก่อนการประเมินควรทำอย่างไร?',
    answer:
      'โทรศัพท์หรือส่ง LINE ในวันเดียวกัน พร้อมระบุหน่วยงานและกำหนดเวลาในฟอร์มด้านล่าง — ทีมจะจัดลำดับและนัดประชุมสั้นหากจำเป็น',
  },
  {
    id: 'cqi',
    question: 'ขอคำปรึกษาโครงการ CQI ต้องเตรียมอะไร?',
    answer:
      'ชื่อโครงการ หน่วยงาน ปัญหา/โอกาสที่ต้องการพัฒนา และข้อมูลเบื้องต้น (ถ้ามี) — ทีมจะช่วยกรอบ PDCA และแนวทางบันทึกในระบบ HA Center',
  },
  {
    id: 'hours',
    question: 'นอกเวลาทำการติดต่อได้ไหม?',
    answer:
      'อีเมลและฟอร์มรับเรื่องตลอด 24 ชม. — ทีมตอบในวันทำการถัดไป กรณีฉุกเฉินด้านคุณภาพโปรดใช้ช่องทางโทรศัพท์',
  },
]

export function buildConsultMailto(params: {
  topic: string
  department: string
  name: string
  email: string
  phone?: string
  urgent: boolean
  message: string
}): string {
  const topicLabel = CONSULT_TOPICS.find((t) => t.value === params.topic)?.label ?? params.topic
  const subject = encodeURIComponent(
    `[HA Center] คำปรึกษา: ${topicLabel}${params.urgent ? ' [เร่งด่วน]' : ''}`
  )
  const body = encodeURIComponent(
    [
      'คำขอปรึกษาศูนย์คุณภาพ HA',
      '────────────────────────',
      `หัวข้อ: ${topicLabel}`,
      `หน่วยงาน: ${params.department}`,
      `ชื่อผู้ติดต่อ: ${params.name}`,
      `อีเมล: ${params.email}`,
      params.phone ? `โทร: ${params.phone}` : '',
      `ความเร่งด่วน: ${params.urgent ? 'เร่งด่วน' : 'ปกติ'}`,
      '',
      'รายละเอียด:',
      params.message,
      '',
      '— ส่งจาก HA Center Dashboard',
    ]
      .filter(Boolean)
      .join('\n')
  )
  return `mailto:${HA_CONTACT.email}?subject=${subject}&body=${body}`
}
