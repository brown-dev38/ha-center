import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { buildAccessPayload, signAccessToken, verifyRefreshToken } from '@/app/auth/server/jwt'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RefreshBody = { refreshToken?: string }

export async function POST(request: NextRequest) {
  let body: RefreshBody
  try {
    body = (await request.json()) as RefreshBody
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.refreshToken) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const payload = verifyRefreshToken(body.refreshToken)
  if (!payload?.sub) {
    return errorResponse(401, 'Refresh token ไม่ถูกต้องหรือหมดอายุ', 'AUTH_TOKEN_INVALID')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub, isActive: true },
    include: { role: true },
  })

  if (!user) {
    return errorResponse(401, 'ไม่พบผู้ใช้', 'USER_NOT_FOUND')
  }

  const accessToken = signAccessToken(buildAccessPayload(user))
  return successResponse({ accessToken })
}

