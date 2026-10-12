import type { Prisma } from '@prisma/client'

/**
 * รูปแบบเลขที่เอกสารมาตรฐาน (Document Control Number)
 *
 * UPW-{DEPT}-{YEAR}-{SEQ}
 *   UPW  = Unit Profile Worksheet (ประเภทเอกสาร)
 *   DEPT = รหัสหน่วยงาน (departments.code) เช่น HA, QA, NUR
 *   YEAR = ปี พ.ศ./ค.ศ. ตามฟิลด์ year
 *   SEQ  = ลำดับรายการต่อหน่วยงานต่อปี (4 หลัก)
 *
 * ตัวอย่าง: UPW-HA-2026-0001
 *
 * เวอร์ชัน: UPW-HA-2026-0001-V01
 */
export const WORKSHEET_ID_PREFIX = 'UPW'
const WORKSHEET_ID_PATTERN = /^UPW-[A-Z0-9]+-\d{4}-\d{4}$/
const VERSION_ID_PATTERN = /^UPW-[A-Z0-9]+-\d{4}-\d{4}-V\d{2}$/

export function normalizeDeptCode(code: string): string {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned || 'GEN'
}

export function formatWorksheetId(deptCode: string, year: number, sequence: number): string {
  const dept = normalizeDeptCode(deptCode)
  const seq = String(sequence).padStart(4, '0')
  if (sequence < 1 || sequence > 9999) {
    throw new Error('WORKSHEET_SEQUENCE_OUT_OF_RANGE')
  }
  return `${WORKSHEET_ID_PREFIX}-${dept}-${year}-${seq}`
}

export function formatWorksheetVersionId(worksheetId: string, versionNo: number): string {
  if (!isStructuredWorksheetId(worksheetId)) {
    throw new Error('INVALID_WORKSHEET_ID_FOR_VERSION')
  }
  const ver = String(versionNo).padStart(2, '0')
  if (versionNo < 1 || versionNo > 99) {
    throw new Error('WORKSHEET_VERSION_OUT_OF_RANGE')
  }
  return `${worksheetId}-V${ver}`
}

export function isStructuredWorksheetId(id: string): boolean {
  return WORKSHEET_ID_PATTERN.test(id)
}

export function isStructuredVersionId(id: string): boolean {
  return VERSION_ID_PATTERN.test(id)
}

export function parseWorksheetId(id: string): {
  prefix: string
  deptCode: string
  year: number
  sequence: number
} | null {
  const match = id.match(/^UPW-([A-Z0-9]+)-(\d{4})-(\d{4})$/)
  if (!match) return null
  return {
    prefix: WORKSHEET_ID_PREFIX,
    deptCode: match[1],
    year: Number(match[2]),
    sequence: Number(match[3]),
  }
}

/** จัดสรรเลขที่เอกสารถัดไป — ใช้ใน transaction เพื่อลดโอกาสชนกัน */
export async function allocateWorksheetId(
  tx: Prisma.TransactionClient,
  departmentCode: string,
  year: number
): Promise<string> {
  const dept = normalizeDeptCode(departmentCode)
  const prefix = `${WORKSHEET_ID_PREFIX}-${dept}-${year}-`

  const latest = await tx.unitProfileWorksheet.findFirst({
    where: { id: { startsWith: prefix } },
    orderBy: { id: 'desc' },
    select: { id: true },
  })

  let nextSeq = 1
  if (latest) {
    const match = latest.id.match(/-(\d{4})$/)
    if (match) nextSeq = Number(match[1]) + 1
  }

  return formatWorksheetId(dept, year, nextSeq)
}
