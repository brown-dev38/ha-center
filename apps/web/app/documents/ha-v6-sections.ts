import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Network,
  Users,
} from 'lucide-react'
import type { NavLink } from '@/app/common/navigation'

export type HaV6Section = {
  id: string
  slug: string
  label: string
  description: string
  icon: LucideIcon
}

export const HA_V6_SECTIONS: HaV6Section[] = [
  {
    id: 'ha-v6-dashboard',
    slug: 'dashboard',
    label: 'แดชบอร์ดติดตามความคืบหน้าแฟ้มเอกสาร HA ฉบับที่ 6',
    description: 'ภาพรวมความคืบหน้าและสถานะแฟ้มเอกสารมาตรฐาน HA ฉบับที่ 6',
    icon: LayoutDashboard,
  },
  {
    id: 'ha-v6-core',
    slug: 'core',
    label: 'แฟ้มเอกสารแกนหลัก HA ฉบับที่ 6',
    description: 'เอกสารแกนหลักและชุดอ้างอิงหลักของมาตรฐาน HA ฉบับที่ 6',
    icon: FileText,
  },
  {
    id: 'ha-v6-governance',
    slug: 'governance',
    label: 'ภาพรวมของการบริหารองค์กร',
    description: 'เอกสารและหลักฐานด้านการบริหารองค์กรตามมาตรฐาน HA',
    icon: Building2,
  },
  {
    id: 'ha-v6-hospital-operations',
    slug: 'hospital-operations',
    label: 'ระบบงานสำคัญของโรงพยาบาล',
    description: 'ระบบงานสำคัญและโครงสร้างการดำเนินงานของโรงพยาบาล',
    icon: Network,
  },
  {
    id: 'ha-v6-patient-care',
    slug: 'patient-care',
    label: 'กระบวนการดูแลผู้ป่วย',
    description: 'กระบวนการและแนวปฏิบัติด้านการดูแลผู้ป่วยตามมาตรฐาน HA',
    icon: HeartPulse,
  },
  {
    id: 'ha-v6-outcomes',
    slug: 'outcomes',
    label: 'ผลการดำเนินการ',
    description: 'ผลลัพธ์ ตัวชี้วัด และรายงานผลการดำเนินงาน',
    icon: BarChart3,
  },
  {
    id: 'ha-v6-unit-profile',
    slug: 'unit-profile',
    label: 'โปรไฟล์หน่วยงานและกลุ่มดูแลผู้ป่วย',
    description: 'Service Profile (SP) และ Clinical Tracer / PCT — ติดตามโปรไฟล์หน่วยงานและกลุ่มดูแลผู้ป่วย',
    icon: Users,
  },
]

const sectionBySlug = new Map(HA_V6_SECTIONS.map((section) => [section.slug, section]))

export function getHaV6Section(slug: string): HaV6Section | undefined {
  return sectionBySlug.get(slug)
}

export function getHaV6DocumentNavChildren(): NavLink[] {
  return HA_V6_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    href: `/dashboard/documents/ha-v6/${section.slug}`,
    icon: section.icon,
    description: section.description,
    readPermission: 'documents:read',
  }))
}
