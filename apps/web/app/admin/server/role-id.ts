/**
 * รูปแบบรหัสบทบาทมาตรฐาน
 *
 * ROLE-{NAME}
 *   NAME = roles.name เป็นตัวพิมพ์ใหญ่ เช่น admin → ADMIN, qa_manager → QA_MANAGER
 *
 * ตัวอย่าง: ROLE-ADMIN, ROLE-DOCUMENT_MANAGER
 */
export const ROLE_ID_PREFIX = 'ROLE'
const ROLE_ID_PATTERN = /^ROLE-[A-Z0-9_]+$/

export function normalizeRoleKey(name: string): string {
  const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  return cleaned || 'UNKNOWN'
}

export function formatRoleId(name: string): string {
  return `${ROLE_ID_PREFIX}-${normalizeRoleKey(name)}`
}

export function isStructuredRoleId(id: string): boolean {
  return ROLE_ID_PATTERN.test(id)
}
