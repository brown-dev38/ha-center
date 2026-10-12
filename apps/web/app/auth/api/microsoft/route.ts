import { NextResponse } from 'next/server'
import {
  buildMicrosoftAuthorizeUrl,
  createOAuthState,
  getMicrosoftConfig,
  microsoftErrors,
  storeOAuthState,
} from '@/app/auth/server/microsoft-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const config = getMicrosoftConfig()
  if (!config) {
    return NextResponse.json(
      {
        success: false,
        error: microsoftErrors.MICROSOFT_NOT_CONFIGURED,
        code: 'MICROSOFT_NOT_CONFIGURED',
      },
      { status: 503 }
    )
  }

  const state = createOAuthState()
  await storeOAuthState(state)
  const url = buildMicrosoftAuthorizeUrl(config, state)
  return NextResponse.redirect(url)
}
