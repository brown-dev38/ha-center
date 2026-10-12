import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Circle,
  HeartPulse,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Files,
  FolderKanban,
  FolderTree,
  Layers,
  GraduationCap,
  History,
  Inbox,
  LayoutDashboard,
  LayoutList,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  Newspaper,
  Phone,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import { getHaV6DocumentNavChildren } from '@/app/documents/ha-v6-sections'

/** ระบบตัวชี้วัด KPI ภายนอก (UPH Services) */
export const KPI_PORTAL_URL = 'https://uphservices.uph.up.ac.th/kpi'

/** หน้าแรกภายในระบบ HA Center */
export const APP_HOME_HREF = '/dashboard'

export function isExternalNavHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

export type NavLink = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description?: string
  /** ต้องมี permission นี้ถึงจะเห็นเมนู (default: แสดงเมื่อ login) */
  readPermission?: string
  /** เฉพาะผู้ดูแลระบบ (admin) */
  adminOnly?: boolean
}

export type NavChild = NavLink | NavGroup

export type NavGroup = {
  id: string
  label: string
  icon: LucideIcon
  description?: string
  readPermission?: string
  adminOnly?: boolean
  children: NavChild[]
}

export type NavEntry = NavLink | NavGroup

export function isNavGroup(entry: NavEntry | NavChild): entry is NavGroup {
  return 'children' in entry
}

/** แบนทุกลิงก์จากเมนู (รวมกลุ่มซ้อน) */
export function flattenNavLinks(entries: NavEntry[] | NavChild[]): NavLink[] {
  const links: NavLink[] = []
  for (const entry of entries) {
    if (isNavGroup(entry)) links.push(...flattenNavLinks(entry.children))
    else links.push(entry)
  }
  return links
}

/** เมนูหลักตามโครงสร้างศูนย์ HA */
export const haMenuEntries: NavEntry[] = [
  {
    id: 'documents-library',
    label: 'จัดการเอกสารคุณภาพ HA',
    icon: Files,
    description: 'ค้นหา อัปโหลด และจัดการเอกสารคุณภาพ HA ตามหมวดหมู่',
    readPermission: 'documents:read',
    children: [
      {
        id: 'documents-add',
        label: 'เพิ่มเอกสารคุณภาพ',
        href: '/dashboard/documents/add',
        icon: Archive,
        description: 'อัปโหลดหรือแนบลิงก์เอกสารคุณภาพใหม่',
        readPermission: 'documents:read',
      },
      {
        id: 'documents-all',
        label: 'เอกสารคุณภาพทั้งหมด',
        href: '/dashboard/documents',
        icon: ListChecks,
        description: 'ค้นหาและดูเอกสารคุณภาพ HA ทั้งหมด',
        readPermission: 'documents:read',
      },
      {
        id: 'documents-by-department',
        label: 'แยกตามหน่วยงาน/ทีม',
        href: '/dashboard/documents/by-department',
        icon: List,
        description: 'จัดกลุ่มเอกสารตามหน่วยงานและทีม',
        readPermission: 'documents:read',
      },
      {
        id: 'documents-official',
        label: 'เอกสารราชการ',
        icon: UserRoundSearch,
        description: 'หนังสือภายในและหนังสือภายนอก',
        readPermission: 'documents:read',
        children: [
          {
            id: 'documents-official-internal',
            label: 'หนังสือภายใน',
            href: '/dashboard/documents/official/internal',
            icon: Circle,
            description: 'หนังสือเวียน / หนังสือภายในองค์กร',
            readPermission: 'documents:read',
          },
          {
            id: 'documents-official-external',
            label: 'หนังสือภายนอก',
            href: '/dashboard/documents/official/external',
            icon: Circle,
            description: 'หนังสือโต้ตอบหน่วยงานภายนอก',
            readPermission: 'documents:read',
          },
        ],
      },
    ],
  },
  {
    id: 'documents',
    label: 'เอกสารมาตรฐาน HA',
    icon: FileText,
    description: 'คู่มือ มาตรฐาน และเอกสารอ้างอิง HA ฉบับที่ 6',
    readPermission: 'documents:read',
    children: getHaV6DocumentNavChildren(),
  },
  // {
  //   id: 'indicators',
  //   label: 'ตัวชี้วัด',
  //   href: KPI_PORTAL_URL,
  //   icon: BarChart3,
  //   description: 'ระบบตัวชี้วัด KPI โรงพยาบาลมหาวิทยาลัยพะเยา',
  //   readPermission: 'indicators:read',
  // },
  {
    id: 'hscs',
    label: 'HSCS',
    href: '/dashboard/hscs',
    icon: ClipboardList,
    description: 'Hospital Survey on Culture of Safety — วัฒนธรรมความปลอดภัย',
    readPermission: 'indicators:read',
  },
  {
    id: 'patient-experience',
    label: 'PEP',
    href: '/dashboard/patient-experience',
    icon: HeartPulse,
    description: 'สำรวจประสบการณ์และความพึงพอใจผู้ป่วยนอก (OPD)',
    readPermission: 'indicators:read',
  },
  {
    id: 'complaints',
    label: 'รับเรื่องร้องเรียน',
    icon: Inbox,
    description: 'ระบบรับเรื่องร้องเรียนและข้อเสนอแนะ',
    readPermission: 'indicators:read',
    children: [
      {
        id: 'complaints-dashboard',
        label: 'แดชบอร์ด',
        href: '/dashboard/complaints',
        icon: LayoutDashboard,
        description: 'สรุปจำนวนเรื่องตามประเภทและสถานะ',
        readPermission: 'indicators:read',
      },
      {
        id: 'complaints-registry',
        label: 'ทะเบียนเรื่อง',
        href: '/dashboard/complaints/registry',
        icon: ClipboardList,
        description: 'ค้นหาและเปิดดูเรื่องทั้งหมด',
        readPermission: 'indicators:read',
      },
      {
        id: 'complaints-import',
        label: 'นำเข้า Excel',
        href: '/dashboard/complaints/import',
        icon: FileSpreadsheet,
        description: 'นำเข้าไฟล์คำร้องเรียน ข้อเสนอแนะ และความคิดเห็น',
        readPermission: 'indicators:read',
      },
      {
        id: 'complaints-tracking',
        label: 'ติดตามเรื่อง',
        href: '/dashboard/complaints/tracking',
        icon: ClipboardCheck,
        description: 'มอบหมายหน่วยงานและปิดเรื่อง',
        readPermission: 'indicators:read',
      },
    ],
  },
  {
    id: 'meetings',
    label: 'ปฏิทินการประชุม',
    href: '/dashboard/meetings',
    icon: CalendarDays,
    description: 'นัดหมายและตารางการประชุม',
    readPermission: 'meetings:read',
  },
  // {
  //   id: 'km',
  //   label: 'KM การจัดการความรู้',
  //   href: '/dashboard/km',
  //   icon: Lightbulb,
  //   description: 'รายงานการประชุม ผลลัพธ์ ระบบ และนวัตกรรม',
  //   readPermission: 'km:read',
  // },
  // {
  //   id: 'cqi',
  //   label: 'โครงการ CQI',
  //   href: '/dashboard/cqi',
  //   icon: ClipboardCheck,
  //   description: 'ผลงานปรับปรุงคุณภาพตามหน่วยงาน PDCA และรางวัล',
  //   readPermission: 'cqi:read',
  // },
  // {
  //   id: 'elearning',
  //   label: 'E-learning HA',
  //   href: '/dashboard/elearning',
  //   icon: GraduationCap,
  //   description: 'เรียนพื้นฐาน HA แบบฝึกหัด และข้อสอบวัดผล',
  //   readPermission: 'elearning:read',
  // },
  // {
  //   id: 'news',
  //   label: 'ข่าวสาร ประกาศล่าสุด',
  //   href: '/dashboard/news',
  //   icon: Newspaper,
  //   description: 'ข่าวและประกาศจากศูนษ์ HA',
  //   readPermission: 'news:read',
  // },
  {
    id: 'links',
    label: 'ลิงก์หน่วยงานเกี่ยวข้อง',
    href: '/dashboard/links',
    icon: Link2,
    description: 'ลิงก์หน่วยงาน รพ.ม.พ.',
    readPermission: 'news:read',
  },
  // {
  //   id: 'contact',
  //   label: 'ติดต่อ / ปรึกษา ศูนย์คุณภาพ HA',
  //   href: '/dashboard/contact',
  //   icon: Phone,
  //   description: 'ช่องทางติดต่อและปรึกษา',
  // },
  {
    id: 'quality-team',
    label: 'เอกสารประกอบทีมนำคุณภาพ',
    icon: FolderKanban,
    description: 'เอกสารและรายงานสำหรับทีมนำคุณภาพ',
    readPermission: 'documents:read',
    children: [
      {
        id: 'quality-team-orders',
        label: 'รายชื่อคำสั่งคณกรรมการทีมนำ',
        href: '/dashboard/quality-team/orders',
        icon: ScrollText,
        description: 'คำสั่งแต่งตั้งและโครงสร้างทีมนำ',
        readPermission: 'documents:read',
      },
      {
        id: 'quality-team-meetings',
        label: 'รายงานการประชุม (PDF)',
        href: '/dashboard/quality-team/meeting-reports',
        icon: FileText,
        description: 'รายงานการประชุมทีมนำคุณภาพ',
        readPermission: 'documents:read',
      },
      {
        id: 'quality-team-indicators',
        label: 'รายงานตัวชี้วัดที่ติดตาม (ทีมนำ)',
        href: '/dashboard/quality-team/indicator-reports',
        icon: BarChart3,
        description: 'สรุปตัวชี้วัดสำหรับทีมนำ',
        readPermission: 'indicators:read',
      },
    ],
  },
  {
    id: 'service-profile',
    label: 'Service Profile',
    href: '/dashboard/service-profile',
    icon: Building2,
    description: 'โปรไฟล์บริการทั้งหน่วยงานและทีมนำคร่อมสายงาน',
  },
  // {
  //   id: 'consult-requests-admin',
  //   label: 'คำขอปรึกษา',
  //   href: '/dashboard/admin/consult-requests',
  //   icon: Inbox,
  //   description: 'คำขอปรึกษาที่ส่งผ่านหน้าติดต่อ',
  //   adminOnly: true,
  // },
  {
    id: 'admin-backend',
    label: 'ระบบหลังบ้าน',
    icon: SlidersHorizontal,
    description: 'ศูนย์ควบคุมระบบสำหรับผู้ดูแล',
    adminOnly: true,
    children: [
      {
        id: 'admin-home',
        label: 'ศูนย์ควบคุมระบบ',
        href: '/dashboard/admin',
        icon: LayoutDashboard,
        description: 'ภาพรวมและทางลัดการจัดการระบบ',
        adminOnly: true,
      },
      {
        id: 'users-admin',
        label: 'จัดการผู้ใช้งาน',
        href: '/dashboard/users',
        icon: Users,
        description: 'เพิ่ม แก้ไข บทบาท แผนก และตำแหน่งผู้ใช้',
        adminOnly: true,
      },
      {
        id: 'admin-menu',
        label: 'จัดการเมนู',
        href: '/dashboard/admin/menu',
        icon: LayoutList,
        description: 'ซ่อน/แสดง แก้ชื่อ จัดลำดับ และเพิ่มเมนู',
        adminOnly: true,
      },
      {
        id: 'admin-settings',
        label: 'ตั้งค่าระบบ',
        href: '/dashboard/admin/settings',
        icon: Settings,
        description: 'แก้ป้ายกำกับ ข้อความหน้า คอลัมน์ตาราง และเนื้อหา HA ฉ.6',
        adminOnly: true,
      },
      {
        id: 'admin-departments',
        label: 'จัดการแผนก',
        href: '/dashboard/admin/departments',
        icon: Building2,
        description: 'เพิ่ม แก้ไข และปิดใช้งานแผนก',
        adminOnly: true,
      },
      {
        id: 'admin-categories',
        label: 'หมวดหมู่เอกสาร',
        href: '/dashboard/admin/document-categories',
        icon: FolderTree,
        description: 'จัดการหมวดหมู่เอกสารมาตรฐาน HA',
        adminOnly: true,
      },
      {
        id: 'admin-quality-units',
        label: 'หน่วยงาน/ทีม',
        href: '/dashboard/admin/quality-units',
        icon: Building2,
        description: 'จัดการ CODE ชื่อ และกลุ่มของหน่วยงานหรือทีมเอกสารคุณภาพ',
        adminOnly: true,
      },
      {
        id: 'admin-quality-levels',
        label: 'ระดับเอกสารคุณภาพ',
        href: '/dashboard/admin/quality-levels',
        icon: Layers,
        description: 'จัดการ CODE และชื่อระดับเอกสารคุณภาพ',
        adminOnly: true,
      },
      {
        id: 'admin-roles',
        label: 'บทบาท & สิทธิ์',
        href: '/dashboard/admin/roles',
        icon: ShieldCheck,
        description: 'ดูสิทธิ์การเข้าถึงของแต่ละบทบาท',
        adminOnly: true,
      },
      {
        id: 'audit-logs-admin',
        label: 'บันทึกการใช้งาน (Audit)',
        href: '/dashboard/admin/audit-logs',
        icon: History,
        description: 'ประวัติการเข้าใช้งานและการเปลี่ยนแปลงข้อมูล',
        adminOnly: true,
      },
    ],
  },
]

/** รายการเมนูระดับบนสุดแบบ serializable — ใช้บนหน้าจัดการเมนู (ไม่รวม icon) */
export type MenuCatalogItem = {
  id: string
  label: string
  type: 'group' | 'link'
  href?: string
  adminOnly?: boolean
  children?: { id: string; label: string; href: string }[]
}

export function getMenuCatalog(): MenuCatalogItem[] {
  return haMenuEntries.map((entry) => {
    if (isNavGroup(entry)) {
      return {
        id: entry.id,
        label: entry.label,
        type: 'group' as const,
        adminOnly: entry.adminOnly,
        children: flattenNavLinks(entry.children).map((c) => ({
          id: c.id,
          label: c.label,
          href: c.href,
        })),
      }
    }
    return {
      id: entry.id,
      label: entry.label,
      type: 'link' as const,
      href: entry.href,
      adminOnly: entry.adminOnly,
    }
  })
}

export const dashboardHomeLink: NavLink = {
  id: 'home',
  label: 'แดชบอร์ด',
  href: KPI_PORTAL_URL,
  icon: LayoutDashboard,
  description: 'ระบบตัวชี้วัด KPI โรงพยาบาลมหาวิทยาลัยพะเยา',
}

/** การ์ดเมนูบนหน้าแรก (รวมทุกลิงก์แบบแบน) */
export function flattenMenuCards(): NavLink[] {
  return flattenNavLinks([dashboardHomeLink, ...haMenuEntries]).filter((c) => c.id !== 'home')
}

export function isPathActive(pathname: string, href: string): boolean {
  if (isExternalNavHref(href)) return false
  if (href === '/dashboard' || href === APP_HOME_HREF) return pathname === '/dashboard' || pathname === '/home'
  // หน้าคลังเอกสารหลัก — ไม่ให้ active ทับเมนู HA v6 ภายใต้ /documents/
  if (href === '/dashboard/documents') {
    return pathname === '/dashboard/documents'
  }
  if (href === '/dashboard/complaints') {
    return pathname === '/dashboard/complaints'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.id === 'documents') {
    return pathname.startsWith('/dashboard/documents/ha-v6')
  }
  return flattenNavLinks(group.children).some((c) => isPathActive(pathname, c.href))
}

export type MenuOverrideInput = {
  hidden?: string[]
  labels?: Record<string, string>
  order?: string[]
  custom?: { id: string; label: string; href: string; description?: string; adminOnly?: boolean }[]
}

/** ปรับเมนูตามการตั้งค่าของแอดมิน (ซ่อน/แก้ชื่อ/จัดลำดับ/เพิ่มลิงก์) */
export function applyMenuOverride(entries: NavEntry[], override?: MenuOverrideInput): NavEntry[] {
  if (!override) return entries
  const hidden = new Set(override.hidden ?? [])
  const labels = override.labels ?? {}

  const mapEntry = (e: NavEntry): NavEntry | null => {
    if (hidden.has(e.id)) return null
    const label = labels[e.id] ?? e.label
    if (isNavGroup(e)) {
      const children = e.children
        .map((c) => mapEntry(c))
        .filter((c): c is NavChild => c != null)
      if (children.length === 0) return null
      return { ...e, label, children }
    }
    return { ...e, label }
  }

  let result: NavEntry[] = entries
    .map((e) => mapEntry(e))
    .filter((e): e is NavEntry => e != null)

  const customLinks: NavLink[] = (override.custom ?? [])
    .filter((c) => c.id && c.label && c.href)
    .map((c) => ({
      id: c.id,
      label: c.label,
      href: c.href,
      icon: Link2,
      description: c.description,
      adminOnly: c.adminOnly,
    }))
  result = [...result, ...customLinks]

  if (override.order && override.order.length) {
    const orderMap = new Map(override.order.map((id, i) => [id, i]))
    const rank = (id: string) => (orderMap.has(id) ? (orderMap.get(id) as number) : Number.MAX_SAFE_INTEGER)
    result = [...result].sort((a, b) => rank(a.id) - rank(b.id))
  }

  return result
}

/** กรองเมนูตามสิทธิ์ผู้ใช้ */
export function filterNavEntries(
  entries: NavEntry[],
  canSee: (readPermission?: string) => boolean,
  isAdminUser?: boolean
): NavEntry[] {
  const filterChild = (entry: NavChild): NavChild | null => {
    if (entry.adminOnly && !isAdminUser) return null
    if (isNavGroup(entry)) {
      if (entry.readPermission && !canSee(entry.readPermission)) return null
      const children = entry.children
        .map((c) => filterChild(c))
        .filter((c): c is NavChild => c != null)
      if (children.length === 0) return null
      return { ...entry, children }
    }
    return canSee(entry.readPermission) ? entry : null
  }

  const result: NavEntry[] = []
  for (const entry of entries) {
    const next = filterChild(entry)
    if (next) result.push(next)
  }
  return result
}
