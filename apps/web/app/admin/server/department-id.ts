/**
 * รูปแบบรหัสหน่วยงานมาตรฐาน
 *
 * DEPT-{CODE}
 *   CODE = departments.code ตัวพิมพ์ใหญ่ เช่น HA, QA, NUR
 *
 * ตัวอย่าง: DEPT-HA, DEPT-QA
 */
export const DEPARTMENT_ID_PREFIX = 'DEPT'
const DEPARTMENT_ID_PATTERN = /^DEPT-[A-Z0-9]+$/

export function normalizeDepartmentCode(code: string): string {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned || 'GEN'
}

export function formatDepartmentId(code: string): string {
  return `${DEPARTMENT_ID_PREFIX}-${normalizeDepartmentCode(code)}`
}

export function isStructuredDepartmentId(id: string): boolean {
  return DEPARTMENT_ID_PATTERN.test(id)
}
