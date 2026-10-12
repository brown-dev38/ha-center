import { NextRequest } from 'next/server'
import { type AuthenticatedUser } from '@/app/auth/server/auth-user'
import { getSessionAuthUser } from '@/app/common/server/session-auth'

export type ViewerRole = AuthenticatedUser['role'] | 'anonymous'

export async function getOptionalAuth(_request: NextRequest): Promise<{
  user: AuthenticatedUser | null
  viewerRole: ViewerRole
}> {
  const user = await getSessionAuthUser()
  if (!user) return { user: null, viewerRole: 'anonymous' }

  return {
    user,
    viewerRole: user.role as ViewerRole,
  }
}
