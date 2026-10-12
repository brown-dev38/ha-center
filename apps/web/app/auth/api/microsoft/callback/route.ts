import { NextRequest, NextResponse } from 'next/server'
import { writeAuditLog } from '@/app/admin/server/audit'
import { buildAccessPayload, buildRefreshPayload, signAccessToken, signRefreshToken } from '@/app/auth/server/jwt'
import {
  consumeOAuthState,
  createExchangeCode,
  exchangeMicrosoftCode,
  fetchMicrosoftProfile,
  frontendCallbackUrl,
  frontendLoginUrl,
  getMicrosoftConfig,
  microsoftErrors,
  storeMicrosoftExchange,
  type MicrosoftExchangePayload,
} from '@/app/auth/server/microsoft-auth'
import { formatMicrosoftUserProfile, resolveMicrosoftUser } from '@/app/auth/server/microsoft-user'
import { prisma } from '@/app/common/server/prisma'
import { getClientIp } from '@/app/auth/server/route-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const config = getMicrosoftConfig()
  const { searchParams } = new URL(request.url)

  if (!config) {
    return NextResponse.redirect(frontendLoginUrl(microsoftErrors.MICROSOFT_NOT_CONFIGURED))
  }

  const oauthError = searchParams.get('error')
  if (oauthError) {
    const msg = searchParams.get('error_description') ?? oauthError ?? 'ยกเลิกการเข้าสู่ระบบ'
    return NextResponse.redirect(frontendLoginUrl(msg))
  }

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(frontendLoginUrl('ข้อมูลจาก Microsoft ไม่ครบ'))
  }

  const stateValid = await consumeOAuthState(state)
  if (!stateValid) {
    return NextResponse.redirect(frontendLoginUrl(microsoftErrors.INVALID_STATE))
  }

  try {
    const tokens = await exchangeMicrosoftCode(config, code)
    const profile = await fetchMicrosoftProfile(tokens.accessToken)
    const user = await resolveMicrosoftUser(profile)

    const accessToken = signAccessToken(buildAccessPayload(user))
    const refreshToken = signRefreshToken(buildRefreshPayload(user.id))

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'auth',
      entityId: user.id,
      newData: { provider: 'microsoft', email: profile.email },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    const exchangeCode = createExchangeCode()
    const payload: MicrosoftExchangePayload = {
      accessToken,
      refreshToken,
      user: formatMicrosoftUserProfile(user),
    }
    await storeMicrosoftExchange(exchangeCode, payload)

    return NextResponse.redirect(frontendCallbackUrl(exchangeCode))
  } catch (err) {
    const key = err instanceof Error ? err.message : ''
    const message =
      key in microsoftErrors
        ? microsoftErrors[key as keyof typeof microsoftErrors]
        : err instanceof Error
          ? err.message
          : 'เข้าสู่ระบบด้วย Microsoft ไม่สำเร็จ'

    await writeAuditLog({
      action: 'LOGIN_FAILED',
      entity: 'auth',
      newData: { provider: 'microsoft', reason: key || message },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })

    return NextResponse.redirect(frontendLoginUrl(message))
  }
}
