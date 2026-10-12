import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import {
  cleanText,
  classifyQuestionKind,
  excelSerialToIso,
  inferSectionCode,
  parseLikert,
} from '@/app/hscs/server/hscs-clean'
import type {
  HscsQuestionMeta,
  HscsResponseRow,
} from '@/app/hscs/server/hscs-analytics-types'

export type ParsedHscsWorkbook = {
  sourceFile: string
  questions: HscsQuestionMeta[]
  rows: HscsResponseRow[]
  warnings: string[]
}

const DEFAULT_RELATIVE = path.join('data', 'hscs', 'HSCS69.xlsx')

export function resolveHscsExcelPath(explicit?: string): string {
  if (explicit) return explicit
  const candidates = [
    path.join(process.cwd(), DEFAULT_RELATIVE),
    path.join(process.cwd(), 'apps', 'web', DEFAULT_RELATIVE),
    path.join(process.cwd(), '..', DEFAULT_RELATIVE),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

function sheetToMatrix(wb: XLSX.WorkBook, nameHint: RegExp): { name: string; matrix: unknown[][] } | null {
  const name =
    wb.SheetNames.find((n) => nameHint.test(n)) ??
    wb.SheetNames.find((n) => nameHint.test(cleanText(n)))
  if (!name) return null
  const sheet = wb.Sheets[name]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][]
  return { name, matrix }
}

function findStaffIdCol(headerRow: unknown[]): number {
  const keys = [/รหัสบุคคล/, /รหัสบุคลากร/, /staff.?id/i, /employee.?id/i, /^id$/i, /รหัส/]
  for (let i = 0; i < headerRow.length; i++) {
    const h = cleanText(headerRow[i])
    if (keys.some((re) => re.test(h))) return i
  }
  return 0
}

function findDeptCol(headerRow: unknown[]): number {
  const keys = [/แผนก/, /วิชาชีพ/, /department/i, /profession/i, /หน่วยงาน/, /กลุ่มงาน/]
  for (let i = 0; i < headerRow.length; i++) {
    const h = cleanText(headerRow[i])
    if (keys.some((re) => re.test(h))) return i
  }
  return 1
}

function findDateCol(headerRow: unknown[]): number {
  const keys = [/วันที่/, /date/i, /timestamp/i, /submitted/i, /เวลา/]
  for (let i = 0; i < headerRow.length; i++) {
    const h = cleanText(headerRow[i])
    if (keys.some((re) => re.test(h))) return i
  }
  return -1
}

function buildQuestionMetas(
  categoryRow: unknown[],
  numberRow: unknown[],
  warnings: string[]
): HscsQuestionMeta[] {
  const questions: HscsQuestionMeta[] = []
  let lastSection = 'A'
  let itemInSection = 0

  for (let col = 0; col < Math.max(categoryRow.length, numberRow.length); col++) {
    const cat = cleanText(categoryRow[col])
    const num = cleanText(numberRow[col])
    if (!cat && !num) continue

    // Skip identity / meta columns
    if (/รหัส|แผนก|วิชาชีพ|ชื่อ|email|วันที่|timestamp|department|staff/i.test(cat) ||
        /รหัส|แผนก|วิชาชีพ|ชื่อ|email|วันที่|timestamp|department|staff/i.test(num)) {
      continue
    }

    const combined = cat || num
    const inferred = inferSectionCode(combined || num, itemInSection)
    let section = inferred.section
    if (section === 'X' && lastSection) section = lastSection
    if (section !== 'X') {
      if (section !== lastSection) itemInSection = 0
      lastSection = section
    }
    itemInSection += 1

    const codeFromNum = num.match(/^([A-Ha-h]\d+)$/)?.[1]?.toUpperCase()
    const code = codeFromNum ?? (num && /^\d+$/.test(num) ? `${section}${num}` : inferred.code)

    const kind = classifyQuestionKind(section, combined)
    questions.push({
      key: code,
      section,
      code,
      label: cat || code,
      colIndex: col,
      kind: kind === 'unknown' ? 'likert' : kind,
    })
  }

  if (!questions.length) {
    warnings.push('ไม่พบคอลัมน์คำถามใน sheet export — ตรวจแถว header')
  }
  return questions
}

function buildDeptLookup(
  matrix: unknown[][],
  warnings: string[]
): Map<string, { department: string; profession: string }> {
  const map = new Map<string, { department: string; profession: string }>()
  if (!matrix.length) {
    warnings.push('Sheet รายงานว่าง')
    return map
  }

  const header = matrix[0] ?? []
  const idCol = findStaffIdCol(header)
  const deptCol = findDeptCol(header)
  const profCol = header.findIndex((c) => /วิชาชีพ|profession/i.test(cleanText(c)))

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r] ?? []
    const id = cleanText(row[idCol]).replace(/\s/g, '')
    if (!id) continue
    const department = cleanText(row[deptCol]) || 'ไม่ระบุ'
    const profession =
      profCol >= 0 ? cleanText(row[profCol]) || department : department
    map.set(id, { department, profession })
  }
  return map
}

/**
 * Parse HSCS69.xlsx (or compatible) into cleaned response rows.
 * Sheet1 `export`: row0 categories, row1 question numbers, row2+ answers
 * Sheet2 report sheet: staff id + department/profession
 */
export function parseHscsExcel(filePath: string): ParsedHscsWorkbook {
  const warnings: string[] = []
  if (!fs.existsSync(filePath)) {
    throw new Error(`ไม่พบไฟล์ Excel: ${filePath}`)
  }

  const wb = XLSX.read(fs.readFileSync(filePath), {
    type: 'buffer',
    cellDates: true,
  })

  const exportSheet =
    sheetToMatrix(wb, /^export$/i) ??
    sheetToMatrix(wb, /export|ส่งออก|raw/i)
  const reportSheet =
    sheetToMatrix(wb, /เพื่อออกรายงาน|รายงาน|report/i) ??
    sheetToMatrix(wb, /HSCS/i)

  if (!exportSheet) {
    throw new Error(
      `ไม่พบ sheet "export" ในไฟล์ (มี: ${wb.SheetNames.join(', ')})`
    )
  }

  const matrix = exportSheet.matrix
  if (matrix.length < 3) {
    throw new Error('Sheet export ต้องมีอย่างน้อย 3 แถว (category, numbers, data)')
  }

  const categoryRow = matrix[0] ?? []
  const numberRow = matrix[1] ?? []
  const questions = buildQuestionMetas(categoryRow, numberRow, warnings)

  const headerForMeta = categoryRow.map((c, i) => cleanText(c) || cleanText(numberRow[i]))
  let idCol = findStaffIdCol(headerForMeta)
  // Often ID is first column even if headers are categories
  if (!cleanText(categoryRow[0]) && !cleanText(numberRow[0])) idCol = 0
  // Try scanning first data row for id-like values in col 0
  const dateCol = findDateCol(headerForMeta)

  const deptLookup = reportSheet
    ? buildDeptLookup(reportSheet.matrix, warnings)
    : new Map<string, { department: string; profession: string }>()

  if (!reportSheet) {
    warnings.push('ไม่พบ sheet รายงาน — จะใช้แผนกเป็น "ไม่ระบุ" ถ้าไม่มีใน export')
  }

  const rows: HscsResponseRow[] = []
  for (let r = 2; r < matrix.length; r++) {
    const raw = matrix[r] ?? []
    const staffId = cleanText(raw[idCol]).replace(/\s/g, '')
    if (!staffId) continue

    const lookup = deptLookup.get(staffId)
    let department = lookup?.department ?? ''
    let profession = lookup?.profession ?? ''

    // Fallback: department may live in export sheet
    if (!department) {
      const deptFromExport = findDeptCol(headerForMeta)
      department = cleanText(raw[deptFromExport]) || 'ไม่ระบุ'
      profession = department
    }

    const ratings: HscsResponseRow['ratings'] = {}
    const texts: HscsResponseRow['texts'] = {}

    for (const q of questions) {
      const cell = raw[q.colIndex]
      if (q.kind === 'text') {
        const t = cleanText(cell)
        if (t) texts[q.key] = t
        continue
      }
      ratings[q.key] = parseLikert(cell)
    }

    rows.push({
      staffId,
      department,
      profession,
      submittedAt: dateCol >= 0 ? excelSerialToIso(raw[dateCol]) : null,
      ratings,
      texts,
    })
  }

  if (!rows.length) warnings.push('ไม่มีแถวคำตอบหลังทำความสะอาด')

  return {
    sourceFile: path.basename(filePath),
    questions,
    rows,
    warnings,
  }
}
