import type { ViewerRole } from '@/app/auth/server/optional-auth'

export const ACCESS_LEVELS = ['public', 'internal', 'confidential'] as const
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

const ROLE_ALLOWED_LEVELS: Record<ViewerRole, AccessLevel[]> = {
  anonymous: ['public'],
  viewer: ['public', 'internal'],
  staff: ['public', 'internal'],
  qa_manager: ['public', 'internal', 'confidential'],
  admin: ['public', 'internal', 'confidential'],
}

export function getAllowedAccessLevels(viewerRole: ViewerRole): AccessLevel[] {
  return ROLE_ALLOWED_LEVELS[viewerRole] ?? ROLE_ALLOWED_LEVELS.anonymous
}

export function canAccessLevel(viewerRole: ViewerRole, accessLevel: string): boolean {
  return getAllowedAccessLevels(viewerRole).includes(accessLevel as AccessLevel)
}

export function isStaffOrAbove(viewerRole: ViewerRole): boolean {
  return viewerRole !== 'anonymous' && viewerRole !== 'viewer'
}

export function buildAccessFilter(viewerRole: ViewerRole, requestedAccess?: string) {
  const allowed = getAllowedAccessLevels(viewerRole)

  if (requestedAccess) {
    if (!allowed.includes(requestedAccess as AccessLevel)) {
      return { allowedLevels: [] as string[] }
    }
    return { allowedLevels: [requestedAccess] }
  }

  return { allowedLevels: allowed }
}
