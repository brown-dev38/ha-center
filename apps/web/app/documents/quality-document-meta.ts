/** ดึงเมตาจาก description ที่บันทึกตอนเพิ่มเอกสารคุณภาพ */

export type QualityDocumentMeta = {
  effectiveDate: string | null
  otherDepartments: string[]
}

export function parseQualityDocumentMeta(description: string | null | undefined): QualityDocumentMeta {
  if (!description?.trim()) {
    return { effectiveDate: null, otherDepartments: [] }
  }

  let effectiveDate: string | null = null
  let otherDepartments: string[] = []

  for (const rawLine of description.split(/\r?\n/)) {
    const line = rawLine.trim()
    const dateMatch = line.match(/^วันบังคับใช้\s*:\s*(.+)$/i)
    if (dateMatch?.[1]) {
      effectiveDate = dateMatch[1].trim()
      continue
    }
    const otherMatch = line.match(/^หน่วยงานอื่นที่ใช้\s*:\s*(.+)$/i)
    if (otherMatch?.[1]) {
      otherDepartments = otherMatch[1]
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }

  return { effectiveDate, otherDepartments }
}

/** แปลงวันที่ ISO / yyyy-mm-dd เป็นรูปแบบสั้นภาษาไทย เช่น 07 ก.ย. 2569 */
export function formatQualityEffectiveDate(value: string | null | undefined): string {
  if (!value?.trim()) return '—'
  const raw = value.trim()
  const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? `${raw.slice(0, 10)}T00:00:00+07:00` : raw
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
