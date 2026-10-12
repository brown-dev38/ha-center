import { compare, hash } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { errorResponse, requireAuthUser } from '@/app/auth/server/auth-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PasswordBody = {
  currentPassword?: string
  newPassword?: string
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  let body: PasswordBody
  try {
    body = (await request.json()) as PasswordBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const currentPassword = body.currentPassword ?? ''
  const newPassword = body.newPassword ?? ''
  if (!currentPassword || newPassword.length < 6) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
  if (!user) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  if (user.microsoftOid) {
    return errorResponse(
      403,
      'บัญชี Microsoft ไม่สามารถเปลี่ยนรหัสผ่านที่นี่ได้ กรุณาใช้บัญชี Microsoft',
      'AUTH_PASSWORD_NOT_ALLOWED'
    )
  }

  const valid = await compare(currentPassword, user.passwordHash)
  if (!valid) {
    return errorResponse(401, 'รหัสผ่านปัจจุบันไม่ถูกต้อง', 'AUTH_INVALID_PASSWORD')
  }

  const passwordHash = await hash(newPassword, 10)
  await prisma.user.update({ where: { id: auth.user.id }, data: { passwordHash } })

  return NextResponse.json({ success: true, message: 'เปลี่ยนรหัสผ่านแล้ว' })
}

