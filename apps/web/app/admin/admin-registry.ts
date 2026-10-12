/** รายการหน้าที่แอดมินแก้หัวข้อ/คำอธิบายได้ — จัดกลุ่มตามโมดูล */
export const PAGE_TEXT_GROUPS = [
  {
    id: 'main',
    title: 'หน้าหลัก',
    pages: [
      {
        key: 'home',
        title: 'แดชบอร์ด',
        description: 'ศูนย์ประสานงานคุณภาพ HA',
      },
      {
        key: 'profile',
        title: 'โปรไฟล์ของฉัน',
        description: 'จัดการข้อมูลส่วนตัว การติดต่อ และรหัสผ่าน (ถ้าเข้าสู่ระบบด้วยบัญชีภายใน)',
      },
      {
        key: 'contact',
        title: 'ติดต่อ / ปรึกษา ศูนย์คุณภาพ HA',
        description: 'พันธมิตรด้านคุณภาพ — ประสาน สนับสนุน และขับเคลื่อน HA ทั้งองค์กร',
      },
    ],
  },
  {
    id: 'documents',
    title: 'เอกสาร & มาตรฐาน HA',
    pages: [
      {
        key: 'documents',
        title: 'เอกสารคุณภาพ',
        description: 'แสดงเอกสารคุณภาพทั้งหมด',
      },
      {
        key: 'documents-add',
        title: 'เพิ่มเอกสารคุณภาพ',
        description: 'อัปโหลดไฟล์ PDF หรือแนบลิงก์ Google Drive เพื่อเพิ่มเอกสารคุณภาพ HA',
      },
      {
        key: 'documents-by-department',
        title: 'แยกตามหน่วยงาน/ทีม',
        description: 'จัดกลุ่มเอกสารคุณภาพตามหมวดหน่วยงานและทีม เพื่อค้นหาและติดตามได้ง่าย',
      },
      {
        key: 'documents-official',
        title: 'เอกสารราชการ',
        description: 'หนังสือภายในและหนังสือภายนอก',
      },
      {
        key: 'documents-official-internal',
        title: 'หนังสือภายใน',
        description: 'เอกสารราชการประเภทหนังสือภายใน / หนังสือเวียนภายในองค์กร',
      },
      {
        key: 'documents-official-external',
        title: 'หนังสือภายนอก',
        description: 'เอกสารราชการประเภทหนังสือโต้ตอบหน่วยงานภายนอก',
      },
      {
        key: 'indicators',
        title: 'ตัวชี้วัด',
        description: 'ระบบตัวชี้วัด KPI โรงพยาบาลมหาวิทยาลัยพะเยา — เปิดในแท็บใหม่',
      },
      {
        key: 'ha-v6-core',
        title: 'แฟ้มเอกสารแกนหลัก HA ฉบับที่ 6',
        description: 'เอกสารระดับองค์กร ที่ต้องมีทุกครั้ง',
        tableTitle: 'เอกสารแกนหลักระดับองค์กร (Core Organizational Documents)',
      },
      {
        key: 'ha-v6-governance',
        title: 'ภาพรวมของการบริหารองค์กร',
        description:
          'ตอนที่ I ภาพรวมของการบริหารองค์กร — Organization Management Overview (I-1 ถึง I-6)',
        tableTitle: 'ตอนที่ I ภาพรวมของการบริหารองค์กร / Organization Management Overview (I-1 ถึง I-6)',
        tableDescription:
          'แก้ไขสถานะจัดทำและ % คืบหน้าได้ — ข้อมูลตอน I จะคำนวณไปยังแดชบอร์ดอัตโนมัติ',
      },
      {
        key: 'ha-v6-hospital-operations',
        title: 'ระบบงานสำคัญของโรงพยาบาล',
        description:
          'ตอนที่ II ระบบงานสำคัญของโรงพยาบาล — Key Hospital Systems (II-1 ถึง II-10) * เพิ่ม II-10 Digital Care',
        tableTitle:
          'ตอนที่ II ระบบงานสำคัญของโรงพยาบาล / Key Hospital Systems (II-1 ถึง II-10) * เพิ่ม II-10 Digital Care',
        tableDescription:
          'แก้ไขสถานะจัดทำและ % คืบหน้าได้ — ข้อมูลตอน II จะคำนวณไปยังแดชบอร์ดอัตโนมัติ',
      },
      {
        key: 'ha-v6-patient-care',
        title: 'กระบวนการดูแลผู้ป่วย',
        description: 'ตอนที่ III กระบวนการดูแลผู้ป่วย — Patient Care Processes (III-1 ถึง III-6)',
        tableTitle: 'ตอนที่ III กระบวนการดูแลผู้ป่วย / Patient Care Processes (III-1 ถึง III-6)',
        tableDescription:
          'แก้ไขสถานะจัดทำและ % คืบหน้าได้ — ข้อมูลตอน III จะคำนวณไปยังแดชบอร์ดอัตโนมัติ',
      },
      {
        key: 'ha-v6-outcomes',
        title: 'ผลการดำเนินการ',
        description: 'ตอนที่ IV ผลการดำเนินการ — Performance Results (IV-1 ถึง IV-6, LeTCI)',
        tableTitle: 'ตอนที่ IV ผลการดำเนินการ / Performance Results (IV-1 ถึง IV-6, LeTCI)',
        tableDescription: 'ตอนที่ IV ผลการดำเนินการ (Performance Results) — รายงานด้วยกรอบ LeTCI',
      },
      {
        key: 'ha-v6-unit-profile',
        title: 'โปรไฟล์หน่วยงานและกลุ่มดูแลผู้ป่วย',
        description: 'Service Profile & Clinical Tracer — SP และ PCT',
        tableTitle: 'Service Profile & Clinical Tracer',
        tableDescription: 'ติดตามโปรไฟล์รายหน่วยงาน (SP) และกลุ่มโรค/Clinical Tracer (PCT)',
      },
      {
        key: 'ha-v6-dashboard',
        title: 'แดชบอร์ดติดตามความคืบหน้าแฟ้มเอกสาร HA ฉบับที่ 6',
        description:
          'โรงพยาบาลมหาวิทยาลัยพะเยา | มาตรฐาน HA ฉบับที่ 6 | มีผลบังคับใช้ 1 ตุลาคม 2569',
      },
    ],
  },
  {
    id: 'quality',
    title: 'คุณภาพ & บริการ',
    pages: [
      {
        key: 'service-profile',
        title: 'Service Profile',
        description: 'โปรไฟล์บริการทั้งหน่วยงานและทีมนำคร่อมสายงาน',
      },
      {
        key: 'cqi',
        title: 'โครงการ CQI',
        description:
          'Continuous Quality Improvement — ผลงานปรับปรุงคุณภาพแยกตามหน่วยงาน รายละเอียด PDCA และรางวัล',
      },
      {
        key: 'km',
        title: 'KM การจัดการความรู้',
        description: 'บันทึกรายงานการประชุม ผลลัพธ์ ระบบที่พัฒนา และนวัตกรรม — ศูนย์ประสานงาน HA',
      },
      {
        key: 'elearning',
        title: 'E-learning HA',
        description: 'เรียนรู้พื้นฐาน Hospital Accreditation — บทเรียน แบบฝึกหัด และข้อสอบวัดผล',
      },
      {
        key: 'news',
        title: 'ข่าวสาร ประกาศล่าสุด',
        description: 'ศูนย์กลางข่าวและประกาศ HA — ค้นหา กรอง และจัดการเวลาเผยแพร่',
      },
      {
        key: 'quality-team-orders',
        title: 'รายชื่อคำสั่งคณะกรรมการทีมนำ',
        description: 'คำสั่งแต่งตั้งและโครงสร้างทีมนำคุณภาพ — เอกสาร PDF',
      },
      {
        key: 'quality-team-meetings',
        title: 'รายงานการประชุมทีมนำคุณภาพ',
        description: 'รายงานการประชุมทีมนำคุณภาพ — เอกสาร PDF',
      },
      {
        key: 'quality-team-indicators',
        title: 'รายงานตัวชี้วัดที่ติดตาม (ทีมนำ)',
        description: 'สรุปสถานะตัวชี้วัดคุณภาพสำหรับทีมนำ — ข้อมูลเชิงลึกดูได้ที่พอร์ทัล KPI',
      },
    ],
  },
  {
    id: 'operations',
    title: 'การประชุม & ลิงก์',
    pages: [
      {
        key: 'meetings',
        title: 'ปฏิทินการประชุม',
        description: 'นัดประชุม จองห้อง และติดตามสถานะ — คลิกชื่อการประชุมเพื่อเปิดรายละเอียด',
      },
      {
        key: 'links',
        title: 'ลิงก์หน่วยงานเกี่ยวข้อง',
        description: 'ลิงก์หน่วยงาน รพ.ม.พ.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'ระบบหลังบ้าน',
    pages: [
      {
        key: 'admin-home',
        title: 'ศูนย์ควบคุมระบบ',
        description: 'จัดการการตั้งค่า เมนู ผู้ใช้ และข้อมูลหลักของระบบศูนย์ HA — เฉพาะผู้ดูแลระบบ',
      },
      {
        key: 'admin-menu',
        title: 'จัดการเมนู',
        description: 'ซ่อน/แสดง แก้ชื่อ จัดลำดับเมนู sidebar และเพิ่มลิงก์ภายนอกหรือภายในระบบ',
      },
      {
        key: 'admin-settings',
        title: 'ตั้งค่าระบบ',
        description: 'แก้ป้ายกำกับ ข้อความหน้า หัวคอลัมน์ และเนื้อหารายการเอกสาร HA ฉ.6',
      },
      {
        key: 'admin-departments',
        title: 'จัดการแผนก',
        description: 'เพิ่ม แก้ไข และปิดใช้งานแผนกในระบบ',
      },
      {
        key: 'admin-categories',
        title: 'หมวดหมู่เอกสาร',
        description: 'จัดการหมวดหมู่ของเอกสารมาตรฐาน HA',
      },
      {
        key: 'admin-quality-units',
        title: 'หน่วยงาน/ทีม',
        description: 'แสดงหน่วยงาน/ทีมทั้งหมด ใช้เป็นรหัสตอนเพิ่มเอกสารคุณภาพ',
      },
      {
        key: 'admin-quality-levels',
        title: 'ระดับเอกสารคุณภาพ',
        description: 'แสดงระดับเอกสารคุณภาพทั้งหมด ใช้เป็นรหัสตอนเพิ่มเอกสารคุณภาพ',
      },
      {
        key: 'admin-roles',
        title: 'บทบาท & สิทธิ์',
        description: 'ดูสิทธิ์การเข้าถึงของแต่ละบทบาทในระบบ',
      },
      {
        key: 'admin-audit',
        title: 'Audit Logs',
        description: 'ติดตามทุกการกระทำของผู้ใช้ในระบบ HA — ค้นหา/กรอง/ดูรายละเอียด JSON',
      },
      {
        key: 'admin-consult',
        title: 'คำขอปรึกษา (ศูนย์ HA)',
        description: 'คำขอปรึกษาที่ส่งผ่านหน้าติดต่อ — ติดตามและอัปเดตสถานะ',
      },
      {
        key: 'users',
        title: 'จัดการผู้ใช้งาน',
        description: 'เพิ่ม แก้ไข และกำหนดสิทธิ์ผู้ใช้ในระบบศูนย์ HA — แผนก ตำแหน่ง และบทบาท',
      },
    ],
  },
] as const

export type PageTextDef = (typeof PAGE_TEXT_GROUPS)[number]['pages'][number]

/** รายการแบน — ใช้ในโค้ดและ API */
export const PAGE_TEXT_REGISTRY: PageTextDef[] = PAGE_TEXT_GROUPS.flatMap((g) => [...g.pages])

/** คอลัมน์ตารางเอกสารมาตรฐาน HA ที่แอดมินปรับได้ */
export const DOCUMENTS_TABLE_COLUMNS = [
  { id: 'sectionNo', label: 'เลขหมวด' },
  { id: 'documentNo', label: 'เลขหนังสือ' },
  { id: 'title', label: 'ชื่อเอกสาร' },
  { id: 'haStandard', label: 'มาตรฐาน HA' },
  { id: 'file', label: 'ไฟล์' },
  { id: 'timestamp', label: 'วันที่และเวลา' },
  { id: 'actions', label: 'จัดการ' },
] as const

/** คอลัมน์ตารางติดตามเอกสาร HA ฉ.6 */
export const HA_V6_TABLE_COLUMNS = [
  { id: 'order', label: 'ลำดับ' },
  { id: 'standardCode', label: 'รหัสมาตรฐาน' },
  { id: 'title', label: 'รายการเอกสาร' },
  { id: 'docType', label: 'ประเภทเอกสาร' },
  { id: 'edition6Status', label: 'สถานะใน ฉ.6' },
  { id: 'responsible', label: 'ผู้รับผิดชอบ / ทีมนำ' },
  { id: 'storage', label: 'ที่จัดเก็บ / ลิงก์' },
  { id: 'remarks', label: 'หมายเหตุ' },
  { id: 'progress', label: '% คืบหน้า' },
  { id: 'status', label: 'สถานะจัดทำ' },
] as const

export type TableColumnDef = { id: string; label: string }

export type UILabelDef = {
  key: string
  default: string
  hint?: string
}

export type UILabelGroup = {
  id: string
  title: string
  labels: UILabelDef[]
}

/** ป้ายกำกับ UI ที่แอดมินแก้ได้ — จัดกลุ่มตามโมดูล */
export const UI_LABEL_GROUPS: UILabelGroup[] = [
  {
    id: 'ha-v6-status',
    title: 'สถานะจัดทำเอกสาร (HA ฉ.6)',
    labels: [
      { key: 'haV6.status.not_started', default: 'ยังไม่เริ่ม' },
      { key: 'haV6.status.in_progress', default: 'กำลังจัดทำ' },
      { key: 'haV6.status.review', default: 'ทบทวน' },
      { key: 'haV6.status.completed', default: 'เสร็จสมบูรณ์' },
    ],
  },
  {
    id: 'ha-v6-storage',
    title: 'ปุ่มและการแนบไฟล์ (HA ฉ.6)',
    labels: [
      { key: 'haV6.storage.add', default: 'เพิ่มลิงก์ / ไฟล์', hint: 'ปุ่มเมื่อยังไม่มีไฟล์แนบ' },
      { key: 'haV6.storage.manage', default: 'จัดการ', hint: 'ปุ่มจัดการไฟล์ที่มีอยู่' },
      { key: 'haV6.storage.items', default: 'รายการแนบ', hint: 'ข้อความแสดงจำนวนไฟล์' },
      { key: 'haV6.storage.hint', default: 'ลิงก์หรือไฟล์', hint: 'คำอธิบายใต้หัวคอลัมน์' },
      { key: 'haV6.storage.link', default: 'ลิงก์', hint: 'ป้ายประเภทลิงก์' },
      { key: 'haV6.remarks.placeholder', default: 'หมายเหตุ', hint: 'placeholder ช่องหมายเหตุ' },
      { key: 'haV6.eyebrow', default: 'เอกสารมาตรฐาน HA ฉบับที่ 6', hint: 'ข้อความเหนือหัวข้อหน้า' },
    ],
  },
  {
    id: 'ha-v6-dashboard',
    title: 'แดชบอร์ดความคืบหน้า (HA ฉ.6)',
    labels: [
      { key: 'haV6.dashboard.col.section', default: 'หมวด / ตอน' },
      { key: 'haV6.dashboard.col.total', default: 'ทั้งหมด' },
      { key: 'haV6.dashboard.col.notStarted', default: 'ยังไม่เริ่ม' },
      { key: 'haV6.dashboard.col.inProgress', default: 'กำลังจัดทำ' },
      { key: 'haV6.dashboard.col.review', default: 'ทบทวน' },
      { key: 'haV6.dashboard.col.completed', default: 'เสร็จ' },
      { key: 'haV6.dashboard.col.percent', default: '% เสร็จ' },
      { key: 'haV6.dashboard.stat.notStarted', default: 'ยังไม่เริ่ม', hint: 'การ์ดสถิติ' },
      { key: 'haV6.dashboard.stat.inProgress', default: 'กำลังจัดทำ' },
      { key: 'haV6.dashboard.stat.review', default: 'ทบทวน' },
      { key: 'haV6.dashboard.stat.completed', default: 'เสร็จสมบูรณ์' },
    ],
  },
  {
    id: 'common',
    title: 'ข้อความทั่วไป',
    labels: [
      { key: 'common.loading', default: 'กำลังโหลด...' },
      { key: 'common.save', default: 'บันทึกการตั้งค่า' },
      { key: 'common.saving', default: 'กำลังบันทึก...' },
      {
        key: 'common.empty',
        default: '—',
      },
    ],
  },
  {
    id: 'admin',
    title: 'ระบบหลังบ้าน (ป้ายกำกับ)',
    labels: [
      { key: 'admin.eyebrow', default: 'ระบบหลังบ้าน', hint: 'ข้อความเหนือหัวข้อหน้าแอดมิน' },
      { key: 'admin.breadcrumb.home', default: 'ศูนย์ควบคุมระบบ', hint: 'ลิงก์กลับในหน้าแอดมิน' },
    ],
  },
]

/** รายการ key ทั้งหมด (ใช้ validate) */
export const ALL_UI_LABEL_KEYS = UI_LABEL_GROUPS.flatMap((g) => g.labels.map((l) => l.key))

/** หมวดเอกสาร HA ฉ.6 สำหรับหน้าแก้ไขเนื้อหา */
export const HA_V6_SECTION_OPTIONS = [
  { id: 'core', label: 'แกนหลัก (CORE)' },
  { id: 'section-i', label: 'ตอน I — ภาพรวมการบริหาร' },
  { id: 'section-ii', label: 'ตอน II — การบริหารจัดการ' },
  { id: 'section-iii', label: 'ตอน III — การดูแลผู้ป่วย' },
  { id: 'section-iv', label: 'ตอน IV — ผลลัพธ์' },
  { id: 'sp-pct', label: 'SP & PCT' },
] as const
