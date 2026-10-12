import { Prisma } from '@prisma/client'
import { errorResponse } from '@/app/auth/server/auth-user'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function isDatabaseUnavailable(error: unknown): boolean {
  const msg = errorMessage(error).toLowerCase()
  return (
    msg.includes("can't reach database") ||
    msg.includes('connection refused') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('environment variable not found: database_url') ||
    msg.includes('invalid `prisma') && msg.includes('invocation') ||
    msg.includes('access denied for user') ||
    msg.includes('unknown database') ||
    msg.includes('getaddrinfo enotfound')
  )
}

export function isDatabaseSchemaMismatch(error: unknown): boolean {
  const msg = errorMessage(error)
  return (
    msg.includes('Unknown column') ||
    msg.includes('does not exist') ||
    msg.includes('Unknown arg') ||
    msg.includes('P2021') ||
    msg.includes('P2022') ||
    msg.includes("Cannot read properties of undefined (reading 'findMany')") ||
    msg.includes("Cannot read properties of undefined (reading 'findUnique')") ||
    msg.includes("Cannot read properties of undefined (reading 'upsert')") ||
    msg.includes("Cannot read properties of undefined (reading 'create')") ||
    /prisma\.\w+ is not a function/i.test(msg)
  )
}

export function handleRouteError(error: unknown): Response {
  console.error('[api]', error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2021' || error.code === 'P2022') {
      return errorResponse(
        503,
        'โครงสร้างฐานข้อมูลไม่ตรงกับระบบ — รัน prisma db push บนฐานข้อมูลที่เชื่อมต่อ',
        'DATABASE_SCHEMA_MISMATCH'
      )
    }
  }

  if (isDatabaseSchemaMismatch(error)) {
    return errorResponse(
      503,
      'โครงสร้างฐานข้อมูลไม่ตรงกับระบบ — รัน prisma db push บนฐานข้อมูลที่เชื่อมต่อ',
      'DATABASE_SCHEMA_MISMATCH'
    )
  }

  if (isDatabaseUnavailable(error)) {
    return errorResponse(
      503,
      'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ — ตรวจสอบ DATABASE_URL (local) หรือตั้งค่าบน Vercel แล้ว Redeploy',
      'DATABASE_UNAVAILABLE'
    )
  }

  return errorResponse(500, 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', 'INTERNAL_ERROR')
}

export async function withRouteHandler(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (error) {
    return handleRouteError(error)
  }
}
