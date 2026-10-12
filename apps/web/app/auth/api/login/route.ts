import { compare } from 'bcryptjs'
import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { buildAccessPayload, buildRefreshPayload, signAccessToken, signRefreshToken } from '@/app/auth/server/jwt'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { isDevLoginEnabled } from '@/app/auth/server/auth-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type LoginBody = { username?: string; password?: string }

export async function POST(request: NextRequest) {
  if (!isDevLoginEnabled()) {
    return errorResponse(403, 'ใช้การเข้าสู่ระบบด้วย Microsoft เท่านั้น', 'DEV_LOGIN_DISABLED')
  }

  let body: LoginBody
  try {
    body = (await request.json()) as LoginBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const username = body.username?.trim()
  const password = body.password ?? ''
  if (!username || password.length < 6) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      OR: [{ username }, { email: username }],
    },
    include: { role: true, department: true },
  })

  const passwordValid = user ? await compare(password, user.passwordHash) : false
  if (!user || !passwordValid) {
    return errorResponse(401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'AUTH_INVALID_CREDENTIALS')
  }

  const accessToken = signAccessToken(buildAccessPayload(user))
  const refreshToken = signRefreshToken(buildRefreshPayload(user.id))

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return successResponse({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role.name,
      department: user.department ? { id: user.department.id, code: user.department.code, name: user.department.name } : null,
    },
  })
}

