import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { consumeMicrosoftExchange, microsoftErrors } from '@/app/auth/server/microsoft-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = { code?: string }

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  if (!body.code || body.code.length < 16) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const payload = await consumeMicrosoftExchange(body.code)
  if (!payload) {
    return errorResponse(400, microsoftErrors.EXCHANGE_EXPIRED, 'EXCHANGE_EXPIRED')
  }

  return successResponse(payload)
}
