import {
  Activity,
  AlertCircle,
  CheckCircle,
  Edit3,
  FileText,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Upload,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

export type AuditActionMeta = {
  label: string
  icon: LucideIcon
  /** tailwind classes สำหรับ chip */
  chip: string
}

const DEFAULT_META: AuditActionMeta = {
  label: 'กิจกรรม',
  icon: Activity,
  chip: 'border-slate-200 bg-slate-50 text-slate-700',
}

const META: Record<string, AuditActionMeta> = {
  LOGIN_SUCCESS: {
    label: 'เข้าสู่ระบบ',
    icon: LogIn,
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  LOGIN_FAILED: {
    label: 'เข้าสู่ระบบไม่สำเร็จ',
    icon: AlertCircle,
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  LOGOUT: {
    label: 'ออกจากระบบ',
    icon: LogOut,
    chip: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  PROFILE_UPDATE: {
    label: 'แก้ไขโปรไฟล์',
    icon: UserCog,
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  PROFILE_PASSWORD_CHANGE: {
    label: 'เปลี่ยนรหัสผ่าน',
    icon: UserCog,
    chip: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  DOCUMENT_CREATE: {
    label: 'เพิ่มเอกสาร',
    icon: Upload,
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  DOCUMENT_DELETE: {
    label: 'ลบเอกสาร',
    icon: Trash2,
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  DOCUMENT_UPDATE: {
    label: 'แก้ไขเอกสาร',
    icon: Edit3,
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  MEETING_CREATE: {
    label: 'สร้างการประชุม',
    icon: Plus,
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  MEETING_DELETE: {
    label: 'ลบการประชุม',
    icon: Trash2,
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  MEETING_UPDATE: {
    label: 'แก้ไขการประชุม',
    icon: Edit3,
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  MEETING_AGENDA_CREATE: {
    label: 'เพิ่มวาระ',
    icon: Plus,
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  MEETING_AGENDA_DELETE: {
    label: 'ลบวาระ',
    icon: Trash2,
    chip: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  MEETING_AGENDA_ATTACHMENT: {
    label: 'แนบเอกสารวาระ',
    icon: FileText,
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  MEETING_AGENDA_TIMER: {
    label: 'จับเวลาวาระ',
    icon: CheckCircle,
    chip: 'border-teal-200 bg-teal-50 text-teal-800',
  },
}

export function getAuditActionMeta(action: string): AuditActionMeta {
  if (META[action]) return META[action]

  if (action.includes('CREATE') || action.includes('UPLOAD'))
    return {
      ...DEFAULT_META,
      icon: Plus,
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      label: action.replaceAll('_', ' '),
    }
  if (action.includes('DELETE'))
    return {
      ...DEFAULT_META,
      icon: Trash2,
      chip: 'border-rose-200 bg-rose-50 text-rose-800',
      label: action.replaceAll('_', ' '),
    }
  if (action.includes('UPDATE') || action.includes('EDIT'))
    return {
      ...DEFAULT_META,
      icon: Edit3,
      chip: 'border-sky-200 bg-sky-50 text-sky-800',
      label: action.replaceAll('_', ' '),
    }
  if (action.includes('LOGIN'))
    return {
      ...DEFAULT_META,
      icon: LogIn,
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      label: action.replaceAll('_', ' '),
    }

  return { ...DEFAULT_META, label: action.replaceAll('_', ' ') }
}

export function formatAuditTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(iso: string): string {
  const date = new Date(iso).getTime()
  const diff = Date.now() - date
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'เมื่อสักครู่'
  if (min < 60) return `${min} นาทีที่แล้ว`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} ชม.ที่แล้ว`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} วันที่แล้ว`
  return new Date(iso).toLocaleDateString('th-TH')
}
