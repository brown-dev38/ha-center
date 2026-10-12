import { NextResponse } from 'next/server'
import { getMicrosoftEnabled, isDevLoginEnabled } from '@/app/auth/server/auth-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      microsoftEnabled: getMicrosoftEnabled(),
      devLoginEnabled: isDevLoginEnabled(),
    },
  })
}

