import * as XLSX from 'xlsx'
import {
  classifyComplaint,
  complaintFingerprint,
  type ComplaintCase,
} from '@/app/complaints/complaint-model'

export type ComplaintDraft = Omit<ComplaintCase, 'id' | 'caseNo' | 'fingerprint' | 'sourceFile'> & {
  fingerprint: string
}

export type ComplaintParseResult = {
  rows: ComplaintDraft[]
  warnings: string[]
  sheetName: string
}

const HEADER_RULES: { field: keyof Pick<ComplaintDraft, 'submittedAt' | 'incidentDate' | 'detail' | 'reporterName' | 'contactEmail' | 'phone' | 'evidenceUrl'>; pattern: RegExp }[] = [
  { field: 'submittedAt', pattern: /ประทับเวลา|timestamp|เวลาที่ส่ง|เวลาส่ง/i },
  { field: 'incidentDate', pattern: /วันเกิดเหตุ|วันที่เข้ารับ|วันที่ \(วัน|วันที่ใช้บริการ|^วันที่$/i },
  { field: 'detail', pattern: /รายละเอียด|คำร้องเรียน|ข้อเสนอแนะ|ความคิดเห็น|เรื่องที่แจ้ง/i },
  { field: 'reporterName', pattern: /ชื่อผู้แจ้ง|ผู้ส่งแบบ|ชื่อ-สกุล|ชื่อสกุล|^ชื่อ$/i },
  { field: 'contactEmail', pattern: /e-?mail|อีเมล|ติดต่อกลับ|ช่องทาง/i },
  { field: 'phone', pattern: /โทร|เบอร์|phone|tel/i },
  { field: 'evidenceUrl', pattern: /ลิงก์|link|drive|หลักฐาน|ไฟล์แนบ|เอกสารแนบ/i },
]

export async function parseComplaintFile(file: File): Promise<ComplaintParseResult> {
  const name = file.name.toLowerCase()
  if (!/\.(xlsx|xls|csv)$/i.test(name)) {
    throw new Error('รองรับเฉพาะไฟล์ .xls, .xlsx หรือ .csv')
  }

  const buffer = await file.arrayBuffer()
  const workbook = name.endsWith('.csv')
    ? XLSX.read(decodeCsv(buffer), { type: 'string', raw: false, cellDates: true })
    : XLSX.read(buffer, { type: 'array', cellDates: true, raw: false })

  const sheetName =
    workbook.SheetNames.find((sheet) => /form|response|คำตอบ|ร้องเรียน|data/i.test(sheet)) ??
    workbook.SheetNames[0]
  if (!sheetName) throw new Error('ไม่พบชีตในไฟล์')

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })
  const headerIndex = matrix.findIndex((row) => row.some((cell) => String(cell).trim()))
  if (headerIndex < 0) throw new Error('ไฟล์ไม่มีหัวตาราง')

  const headers = matrix[headerIndex].map((cell) => String(cell ?? '').trim())
  const fields = mapHeaders(headers)
  const warnings: string[] = []
  if (!fields.detail) warnings.push('ไม่พบคอลัมน์รายละเอียด — ใช้คอลัมน์ข้อความที่ยาวที่สุด')

  const rows: ComplaintDraft[] = []
  for (const line of matrix.slice(headerIndex + 1)) {
    const record = readRow(line, fields)
    if (!record.detail.trim()) continue
    const classified = classifyComplaint(record.detail)
    rows.push({
      ...record,
      ...classified,
      status: 'new',
      assignee: '',
      dueDate: '',
      responseNote: '',
      fingerprint: complaintFingerprint(record.submittedAt, record.detail),
    })
  }

  if (!rows.length) throw new Error('ไม่พบแถวที่มีรายละเอียดเรื่อง')
  warnings.push(`อ่านได้ ${rows.length.toLocaleString('th-TH')} เรื่องจากชีต ${sheetName}`)
  return { rows, warnings, sheetName }
}

function decodeCsv(buffer: ArrayBuffer): string {
  let text = new TextDecoder('utf-8').decode(buffer)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  return text
}

function mapHeaders(headers: string[]): Partial<Record<string, number>> {
  const fields: Partial<Record<string, number>> = {}
  headers.forEach((header, index) => {
    if (!header) return
    const rule = HEADER_RULES.find((item) => item.pattern.test(header) && fields[item.field] == null)
    if (rule) fields[rule.field] = index
  })
  return fields
}

function readRow(
  line: (string | number | Date)[],
  fields: Partial<Record<string, number>>
): Omit<ComplaintDraft, 'kind' | 'priority' | 'department' | 'status' | 'assignee' | 'dueDate' | 'responseNote' | 'fingerprint'> {
  const cell = (field: string) => {
    const index = fields[field]
    return index == null ? '' : clean(line[index])
  }

  let detail = cell('detail')
  if (!detail) {
    let longest = ''
    line.forEach((value) => {
      const text = clean(value)
      if (text.length > longest.length && !/^https?:/i.test(text)) longest = text
    })
    detail = longest
  }

  let contactEmail = cell('contactEmail')
  let phone = cell('phone')
  let evidenceUrl = cell('evidenceUrl')

  line.forEach((value) => {
    const text = clean(value)
    if (!text) return
    const mail = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
    if (mail && !contactEmail) contactEmail = mail
    const tel = text.match(/0\d{8,9}/)?.[0]
    if (tel && !phone) phone = tel
    const link = text.match(/https?:\/\/\S+/i)?.[0]
    if (link && !evidenceUrl) evidenceUrl = link
  })

  const submittedAt = toIso(cell('submittedAt')) || toIso(cell('incidentDate'))
  const incidentDate = toIso(cell('incidentDate')) || submittedAt

  return {
    submittedAt,
    incidentDate,
    detail,
    reporterName: cell('reporterName'),
    contactEmail,
    phone,
    evidenceUrl,
  }
}

function clean(value: unknown): string {
  if (value == null) return ''
  return String(value).replace(/\u00a0/g, ' ').trim()
}

function toIso(value: string): string {
  if (!value) return ''
  const serial = Number(value)
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const utc = Date.UTC(1899, 11, 30) + serial * 86400000
    return new Date(utc).toISOString()
  }

  const stamp = value.match(
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  )
  if (stamp) {
    const a = Number(stamp[1])
    const b = Number(stamp[2])
    let year = Number(stamp[3])
    const buddhist = year > 2400
    if (buddhist) year -= 543
    const dayFirst = buddhist || a > 12
    const day = dayFirst ? a : b
    const month = dayFirst ? b : a
    const hour = Number(stamp[4] ?? 0)
    const minute = Number(stamp[5] ?? 0)
    const second = Number(stamp[6] ?? 0)
    const date = new Date(year, month - 1, day, hour, minute, second)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}
