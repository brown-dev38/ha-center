import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { getOnlineCount, removePresence } from '@/app/common/server/presence-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

  removePresence(auth.user.id)
  return successResponse({ ok: true, onlineCount: getOnlineCount() })
}
