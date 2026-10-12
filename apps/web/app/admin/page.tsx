'use client'

import Link from 'next/link'
import {
  Building2,
  FileText,
  FolderTree,
  Layers,
  History,
  LayoutList,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { AdminGuard } from '@/app/common/admin-guard'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { useAdminOverview } from '@/hooks/use-admin'

type StatDef = { label: string; value: number; hint?: string }
type ModuleDef = {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

const MODULES: ModuleDef[] = [
  {
    href: '/dashboard/users',
    icon: Users,
    title: 'จัดการผู้ใช้งาน',
    description: 'เพิ่ม แก้ไข บทบาท แผนก และตำแหน่งของผู้ใช้',
  },
  {
    href: '/dashboard/admin/menu',
    icon: LayoutList,
    title: 'จัดการเมนู',
    description: 'ซ่อน/แสดง แก้ชื่อ จัดลำดับ และเพิ่มเมนูลิงก์ใหม่',
  },
  {
    href: '/dashboard/admin/settings',
    icon: Settings,
    title: 'ตั้งค่าระบบ',
    description: 'แก้ป้ายกำกับ ข้อความหน้า หัวคอลัมน์ และเนื้อหารายการเอกสาร HA ฉ.6',
  },
  {
    href: '/dashboard/admin/departments',
    icon: Building2,
    title: 'จัดการแผนก',
    description: 'เพิ่ม แก้ไข และปิดใช้งานแผนกในระบบ',
  },
  {
    href: '/dashboard/admin/document-categories',
    icon: FolderTree,
    title: 'หมวดหมู่เอกสาร',
    description: 'จัดการหมวดหมู่ของเอกสารมาตรฐาน HA',
  },
  {
    href: '/dashboard/admin/quality-units',
    icon: Building2,
    title: 'หน่วยงาน/ทีม',
    description: 'จัดการ CODE ชื่อ และกลุ่มที่ใช้สร้างรหัสเอกสารคุณภาพ',
  },
  {
    href: '/dashboard/admin/quality-levels',
    icon: Layers,
    title: 'ระดับเอกสารคุณภาพ',
    description: 'จัดการ CODE และชื่อระดับที่ใช้สร้างรหัสเอกสารคุณภาพ',
  },
  {
    href: '/dashboard/admin/roles',
    icon: ShieldCheck,
    title: 'บทบาท & สิทธิ์',
    description: 'ดูสิทธิ์การเข้าถึงของแต่ละบทบาทในระบบ',
  },
  {
    href: '/dashboard/admin/audit-logs',
    icon: History,
    title: 'บันทึกการใช้งาน (Audit)',
    description: 'ประวัติการเข้าใช้งานและการเปลี่ยนแปลงข้อมูล',
  },
]

function AdminHome() {
  const { data, isLoading } = useAdminOverview()

  const stats: StatDef[] = [
    { label: 'ผู้ใช้ทั้งหมด', value: data?.totalUsers ?? 0, hint: `ใช้งานอยู่ ${data?.activeUsers ?? 0}` },
    { label: 'เอกสาร HA', value: data?.totalDocuments ?? 0, hint: `ซ่อนอยู่ ${data?.hiddenDocuments ?? 0}` },
    { label: 'Unit Profile', value: data?.totalWorksheets ?? 0 },
    { label: 'แผนก', value: data?.departments ?? 0 },
    { label: 'หมวดหมู่เอกสาร', value: data?.categories ?? 0 },
    { label: 'กิจกรรม 7 วัน', value: data?.recentAudit ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <AdminEditablePageHeader
        pageKey="admin-home"
        title="ศูนย์ควบคุมระบบ"
        description="จัดการการตั้งค่า เมนู ผู้ใช้ และข้อมูลหลักของระบบศูนย์ HA — เฉพาะผู้ดูแลระบบ"
        icon={SlidersHorizontal}
        variant="hero"
        eyebrow="ระบบหลังบ้าน"
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <SurfaceCard key={s.label} className="p-4">
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-heading text-2xl font-bold text-foreground">
              {isLoading ? '—' : s.value.toLocaleString('th-TH')}
            </div>
            {s.hint && <div className="mt-0.5 text-[0.7rem] text-muted-foreground">{s.hint}</div>}
          </SurfaceCard>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href}>
            <SurfaceCard interactive className="h-full p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <m.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-heading text-[0.98rem] font-semibold text-foreground">
                    {m.title}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {m.description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </Link>
        ))}
      </section>
    </div>
  )
}

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  )
}
