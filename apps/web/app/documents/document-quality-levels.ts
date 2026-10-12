/** ระดับเอกสารคุณภาพ — ค่าเริ่มต้นตรงตามทะเบียนที่ใช้ในระบบหลังบ้าน */

export type QualityDocumentLevel = {
  id: string
  order: number
  code: string
  name: string
}

export const DEFAULT_QUALITY_DOCUMENT_LEVELS: QualityDocumentLevel[] = [
  {
    id: 'ql-sar',
    order: 1,
    code: 'SAR',
    name: 'รายงานการประเมินตนเอง (Self Assessment Report: SAR)',
  },
  { id: 'ql-fm', order: 2, code: 'FM', name: 'แบบฟอร์ม (Form)' },
  { id: 'ql-sd', order: 3, code: 'SD', name: 'เอกสารสนับสนุน (Support Document)' },
  { id: 'ql-wi', order: 4, code: 'WI', name: 'แนวทางปฏิบัติ (Work Instruction)' },
  { id: 'ql-sp', order: 5, code: 'SP', name: 'ระเบียบปฏิบัติ (System Procedure)' },
  { id: 'ql-qm', order: 6, code: 'QM', name: 'นโยบายคุณภาพ (Quality Manual)' },
]

export const DOCUMENT_QUALITY_LEVELS = DEFAULT_QUALITY_DOCUMENT_LEVELS.map((level) => ({
  code: level.code,
  label: level.name,
}))

export type DocumentQualityLevelCode = string

export function buildQualityDocumentCode(params: {
  departmentCode: string
  levelCode: string
  effectiveDate?: string
}) {
  const dept = params.departmentCode.trim().toUpperCase()
  const level = params.levelCode.trim().toUpperCase()
  if (!dept || !level) return ''

  const datePart = params.effectiveDate?.trim()
    ? params.effectiveDate.replace(/-/g, '').slice(0, 8)
    : ''

  return datePart ? `${dept}-${level}-${datePart}` : `${dept}-${level}`
}

export function buildQualityDocumentDescription(params: {
  effectiveDate?: string
  otherDepartments?: string[]
}) {
  const lines: string[] = []
  if (params.effectiveDate?.trim()) {
    lines.push(`วันบังคับใช้: ${params.effectiveDate.trim()}`)
  }
  if (params.otherDepartments?.length) {
    lines.push(`หน่วยงานอื่นที่ใช้: ${params.otherDepartments.join(', ')}`)
  }
  return lines.length ? lines.join('\n') : undefined
}
