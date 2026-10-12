import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { errorResponse, mapMeProfile, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PatchMeBody = {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  jobTitle?: string | null
  phone?: string | null
  lineUserId?: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    include: { role: true, department: true },
  })

  if (!user) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  return successResponse(mapMeProfile(user))
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  let body: PatchMeBody
  try {
    body = (await request.json()) as PatchMeBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const username = body.username === undefined ? undefined : body.username?.trim() || null

  if (username !== undefined) {
    const conflict = await prisma.user.findFirst({
      where: { username, id: { not: auth.user.id } },
    })
    if (conflict) {
      return errorResponse(409, 'ชื่อผู้ใช้นี้ถูกใช้แล้ว', 'PROFILE_USERNAME_DUPLICATE')
    }
  }

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      ...(body.firstName !== undefined && body.firstName !== null
        ? { firstName: body.firstName.trim() }
        : {}),
      ...(body.lastName !== undefined && body.lastName !== null
        ? { lastName: body.lastName.trim() }
        : {}),
      ...(username !== undefined ? { username } : {}),
      ...(body.jobTitle !== undefined ? { jobTitle: body.jobTitle?.trim() || null } : {}),
      ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
      ...(body.lineUserId !== undefined ? { lineUserId: body.lineUserId?.trim() || null } : {}),
    },
    include: { role: true, department: true },
  })

  return successResponse(mapMeProfile(updated), 'บันทึกโปรไฟล์แล้ว')
}

