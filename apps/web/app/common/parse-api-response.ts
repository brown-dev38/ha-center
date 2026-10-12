const DATABASE_HINT =
  'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ — ตรวจสอบ DATABASE_URL ใน .env.local แล้วลองใหม่'

const DATABASE_ERROR_CODES = new Set([
  'DATABASE_UNAVAILABLE',
  'DATABASE_URL_MISSING',
  'DATABASE_SCHEMA_MISMATCH',
])

const LEGACY_PROXY_HINT =
  'ระบบ API เก่าถูกปิดแล้ว — รีสตาร์ท dev server (npm run dev) และตรวจสอบว่าไม่มี API_PROXY_URL ใน .env.local'

/** แปลง code + ข้อความจาก API เป็นข้อความภาษาไทยที่เข้าใจง่าย */
export function rewriteApiError(message: string, code?: string): string {
  if (code === 'LEGACY_API_PROXY_DISABLED' || message.includes('Legacy API proxy is disabled')) {
    return LEGACY_PROXY_HINT
  }

  if (code && DATABASE_ERROR_CODES.has(code)) {
    return code === 'DATABASE_SCHEMA_MISMATCH' ? message : DATABASE_HINT
  }

  const lower = message.toLowerCase()
  if (
    message.includes('DATABASE_URL') ||
    message.includes('DATABASE_UNAVAILABLE') ||
    message.includes('DATABASE_URL_MISSING') ||
    lower.includes('environment variable not found: database_url')
  ) {
    return DATABASE_HINT
  }

  return message
}

/** @deprecated ใช้ rewriteApiError แทน */
export function rewriteStaleProxyError(message: string): string {
  return rewriteApiError(message)
}

/** แปลง body ที่ไม่ใช่ JSON (เช่น 502 Bad Gateway) เป็นข้อความภาษาไทย */
export function apiResponseBodyError(status: number, bodyPreview = ''): Error {
  const preview = bodyPreview.trim().slice(0, 120)
  const looksLikeGateway =
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /^50[234]\b/.test(preview) ||
    preview.includes('Bad Gateway') ||
    preview.includes('Service Unavailable')

  if (looksLikeGateway) {
    return new Error('เซิร์ฟเวอร์ไม่ตอบสนองชั่วคราว — ลองรีเฟรชหน้าเว็บอีกครั้ง')
  }

  if (status === 401) {
    return new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
  }

  return new Error(
    preview
      ? `ไม่สามารถโหลดข้อมูลได้ (HTTP ${status}): ${preview}`
      : `ไม่สามารถโหลดข้อมูลได้ (HTTP ${status})`
  )
}

export function normalizeJsonParseError(err: unknown): Error {
  if (!(err instanceof Error)) {
    return new Error('เกิดข้อผิดพลาดในการรับข้อมูล')
  }
  if (
    err.message.includes('Unexpected non-whitespace character after JSON') ||
    err.message.includes('Unexpected token') ||
    err.message.includes('is not valid JSON')
  ) {
    return apiResponseBodyError(502)
  }
  return err
}

export async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed) {
    throw apiResponseBodyError(response.status, '')
  }
  try {
    const json = JSON.parse(trimmed) as T & {
      success?: boolean
      error?: string
      message?: string
      code?: string
    }
    if (!response.ok) {
      const raw =
        json && typeof json === 'object'
          ? (json.error ?? json.message ?? `HTTP ${response.status}`)
          : `HTTP ${response.status}`
      const code = json && typeof json === 'object' ? json.code : undefined
      throw new Error(rewriteApiError(String(raw), code))
    }
    if (json && typeof json === 'object' && json.success === false) {
      const raw = json.error ?? json.message ?? 'เกิดข้อผิดพลาด'
      throw new Error(rewriteApiError(raw, json.code))
    }
    return json as T
  } catch (err) {
    // คงข้อความ Error ที่โยนจากด้านบนไว้ (อย่าคลุมด้วย HTTP preview อีกชั้น)
    if (err instanceof Error && err.message === DATABASE_HINT) {
      throw err
    }
    if (
      err instanceof Error &&
      !(
        err.message.includes('Unexpected non-whitespace character after JSON') ||
        err.message.includes('Unexpected token') ||
        err.message.includes('is not valid JSON') ||
        err.name === 'SyntaxError'
      )
    ) {
      throw err
    }
    throw apiResponseBodyError(response.status, trimmed)
  }
}

/** อ่าน envelope `{ success, data }` — throw ข้อความภาษาไทยเมื่อ API ล้มเหลว */
export async function readApiData<T>(response: Response): Promise<T> {
  const json = await readApiJson<{ success: true; data: T }>(response)
  if (json.data === undefined || json.data === null) {
    throw new Error('ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์')
  }
  return json.data
}

/** ตรวจก่อน Eden / response.json() — กัน parse "502 Bad Gateway" */
export async function assertJsonResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response
  }

  const preview = (await response.clone().text()).trim()
  if (preview.startsWith('{') || preview.startsWith('[')) {
    return response
  }

  throw apiResponseBodyError(response.status, preview)
}
