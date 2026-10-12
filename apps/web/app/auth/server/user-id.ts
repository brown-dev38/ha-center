import type { Prisma } from '@prisma/client'

/**
 * รูปแบบรหัสผู้ใช้มาตรฐาน
 *
 * USR-{SEQ}
 *   USR = User
 *   SEQ = ลำดับผู้ใช้ทั้งระบบ (4 หลัก)
 *
 * ตัวอย่าง: USR-0001
 */
export const USER_ID_PREFIX = 'USR'
const USER_ID_PATTERN = /^USR-\d{4}$/

export function formatUserId(sequence: number): string {
  if (sequence < 1 || sequence > 9999) {
    throw new Error('USER_SEQUENCE_OUT_OF_RANGE')
  }
  return `${USER_ID_PREFIX}-${String(sequence).padStart(4, '0')}`
}

export function isStructuredUserId(id: string): boolean {
  return USER_ID_PATTERN.test(id)
}

export function parseUserId(id: string): { prefix: string; sequence: number } | null {
  const match = id.match(/^USR-(\d{4})$/)
  if (!match) return null
  return { prefix: USER_ID_PREFIX, sequence: Number(match[1]) }
}

/** จัดสรรรหัสผู้ใช้ถัดไป — ใช้ใน transaction เพื่อลดโอกาสชนกัน */
export async function allocateUserId(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = `${USER_ID_PREFIX}-`
  const latest = await tx.user.findFirst({
    where: { id: { startsWith: prefix } },
    orderBy: { id: 'desc' },
    select: { id: true },
  })

  let nextSeq = 1
  if (latest) {
    const parsed = parseUserId(latest.id)
    if (parsed) nextSeq = parsed.sequence + 1
  }

  return formatUserId(nextSeq)
}
