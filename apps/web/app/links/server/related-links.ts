export type RelatedLinkInput = {
  title: string
  url: string
  description: string | null
  sortOrder: number
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** ตรวจและแปลง body สำหรับสร้าง/แก้ไขลิงก์หน่วยงาน */
export function parseRelatedLinkInput(
  body: unknown
): { ok: true; data: RelatedLinkInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }
  const b = body as Record<string, unknown>

  const title = typeof b.title === 'string' ? b.title.trim() : ''
  if (!title) return { ok: false, error: 'กรุณาระบุชื่อลิงก์' }

  const url = typeof b.url === 'string' ? b.url.trim() : ''
  if (!url) return { ok: false, error: 'กรุณาระบุ URL' }
  if (!isValidUrl(url)) return { ok: false, error: 'URL ต้องขึ้นต้นด้วย http:// หรือ https://' }

  const description =
    typeof b.description === 'string' && b.description.trim() ? b.description.trim() : null
  const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0

  return { ok: true, data: { title, url, description, sortOrder } }
}
