import { NextRequest } from 'next/server'
import { getAdminUser, updateAdminUser } from '@/app/users/server/admin-users'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { requireRole } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'admin')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  const user = await getAdminUser(id)
  if (!user) return errorResponse(404, 'ไม่พบผู้ใช้', 'USER_NOT_FOUND')
  return successResponse(user)
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireRole(request, 'admin')
  if ('error' in auth) return auth.error

  const { id } = await ctx.params
  let body: Parameters<typeof updateAdminUser>[1]
  try {
    body = (await request.json()) as Parameters<typeof updateAdminUser>[1]
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  try {
    const user = await updateAdminUser(id, body, auth.auth.user)
    return successResponse(user, 'บันทึกผู้ใช้สำเร็จ')
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'USER_NOT_FOUND') return errorResponse(404, 'ไม่พบผู้ใช้', 'USER_NOT_FOUND')
      if (e.message === 'USER_DUPLICATE') return errorResponse(409, 'อีเมลหรือชื่อผู้ใช้ซ้ำ', 'USER_DUPLICATE')
    }
    throw e
  }
}
