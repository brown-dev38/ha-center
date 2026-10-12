export type ComplaintKind = 'complaint' | 'suggestion' | 'comment' | 'document' | 'risk'

export type ComplaintStatus = 'new' | 'accepted' | 'in_progress' | 'replied' | 'closed'

export type ComplaintPriority = 'urgent' | 'high' | 'normal' | 'low'

export type ComplaintCase = {
  id: string
  caseNo: string
  submittedAt: string
  incidentDate: string
  detail: string
  reporterName: string
  contactEmail: string
  phone: string
  evidenceUrl: string
  kind: ComplaintKind
  priority: ComplaintPriority
  status: ComplaintStatus
  department: string
  assignee: string
  dueDate: string
  responseNote: string
  sourceFile: string
  fingerprint: string
}

export const COMPLAINT_KIND_LABEL: Record<ComplaintKind, string> = {
  complaint: 'ร้องเรียน',
  suggestion: 'ข้อเสนอแนะ',
  comment: 'ความคิดเห็น',
  document: 'ขอเอกสาร',
  risk: 'ความเสี่ยง',
}

export const COMPLAINT_STATUS_LABEL: Record<ComplaintStatus, string> = {
  new: 'ใหม่',
  accepted: 'รับเรื่องแล้ว',
  in_progress: 'กำลังดำเนินการ',
  replied: 'ตอบกลับแล้ว',
  closed: 'ปิดเรื่อง',
}

export const COMPLAINT_PRIORITY_LABEL: Record<ComplaintPriority, string> = {
  urgent: 'เร่งด่วน',
  high: 'สูง',
  normal: 'ปกติ',
  low: 'ต่ำ',
}

export const COMPLAINT_DEPARTMENTS = [
  'ไม่ระบุ',
  'ผู้ป่วยนอก',
  'ผู้ป่วยใน',
  'ผู้ป่วยฉุกเฉิน',
  'เภสัชกรรม',
  'การเงิน',
  'เวชระเบียน',
  'ศูนย์คุณภาพ',
] as const

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'new',
  'accepted',
  'in_progress',
  'replied',
  'closed',
]

export function classifyComplaint(detail: string): {
  kind: ComplaintKind
  priority: ComplaintPriority
  department: string
} {
  const text = detail.trim()
  const kind = detectKind(text)
  return {
    kind,
    priority: detectPriority(text, kind),
    department: detectDepartment(text),
  }
}

function detectKind(text: string): ComplaintKind {
  if (/แพ้ยา|ภาวะแทรกซ้อน|ผิดพลาด|dtp|fv\b|อุบัติการณ์|ความเสี่ยง/i.test(text)) return 'risk'
  if (/ขอเอกสาร|ขอสำเนา|ขอประวัติ/.test(text)) return 'document'
  if (/ร้องเรียน|ไม่พอใจ|เรียกเก็บ|รอนาน|ล่าช้า|แย่|หยาบ|ผิด/.test(text)) return 'complaint'
  if (/เสนอ|อยากให้|ควรจะ|แนะนำให้/.test(text)) return 'suggestion'
  return 'comment'
}

function detectPriority(text: string, kind: ComplaintKind): ComplaintPriority {
  if (/แพ้ยา|ฉุกเฉิน|เสียชีวิต|เรียกเก็บเงิน|เลือดออก/i.test(text)) return 'urgent'
  if (kind === 'risk' || kind === 'complaint') return 'high'
  if (kind === 'document') return 'low'
  return 'normal'
}

function detectDepartment(text: string): string {
  if (/เภสัช|ยา|dtp|fv\b/i.test(text)) return 'เภสัชกรรม'
  if (/การเงิน|เรียกเก็บ|ใบเสร็จ|ค่าใช้จ่าย/.test(text)) return 'การเงิน'
  if (/เวชระเบียน|ขอเอกสาร|ประวัติ/.test(text)) return 'เวชระเบียน'
  if (/ฉุกเฉิน/.test(text)) return 'ผู้ป่วยฉุกเฉิน'
  if (/ผู้ป่วยใน|หอผู้ป่วย|นอน รพ/.test(text)) return 'ผู้ป่วยใน'
  if (/ผู้ป่วยนอก|opd/i.test(text)) return 'ผู้ป่วยนอก'
  return 'ไม่ระบุ'
}

export function nextCaseNo(existing: ComplaintCase[], submittedAt: string): string {
  const year = buddhistYear(submittedAt)
  const prefix = `VOC-${year}-`
  const seq = existing.reduce((max, item) => {
    if (!item.caseNo.startsWith(prefix)) return max
    const n = Number(item.caseNo.slice(prefix.length))
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, 0)
  return `${prefix}${String(seq + 1).padStart(4, '0')}`
}

function buddhistYear(iso: string): number {
  const year = Number(iso.slice(0, 4))
  if (!Number.isFinite(year) || year < 1900) return new Date().getFullYear() + 543
  return year > 2400 ? year : year + 543
}

export function formatThaiDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function complaintFingerprint(submittedAt: string, detail: string): string {
  return `${submittedAt}|${detail.replace(/\s+/g, ' ').trim().slice(0, 180)}`
}
