import { NextRequest } from 'next/server'
import { createAdminUser, listAdminUsers } from '@/app/users/server/admin-users'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { requireRole } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin')
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const isActiveRaw = searchParams.get('isActive')
  const data = await listAdminUsers({
    departmentId: searchParams.get('departmentId') ?? undefined,
    roleId: searchParams.get('roleId') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    isActive: isActiveRaw === null ? undefined : isActiveRaw === 'true',
  })
  return successResponse(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin')
  if ('error' in auth) return auth.error

  let body: Parameters<typeof createAdminUser>[0]
  try {
    body = (await request.json()) as Parameters<typeof createAdminUser>[0]
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  try {
    const user = await createAdminUser(body, auth.auth.user)
    return successResponse(user, 'สร้างผู้ใช้สำเร็จ')
  } catch (e) {
    if (e instanceof Error && e.message === 'USER_DUPLICATE') {
      return errorResponse(409, 'อีเมลหรือชื่อผู้ใช้ซ้ำ', 'USER_DUPLICATE')
    }
    throw e
  }
}
