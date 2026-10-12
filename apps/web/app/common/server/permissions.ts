export type RoleName = 'admin' | 'qa_manager' | 'document_manager' | 'staff' | 'viewer'

const PERMISSIONS: Record<RoleName, string[]> = {
  admin: ['*'],
  qa_manager: [
    'documents:read',
    'documents:write',
    'meetings:read',
    'meetings:write',
    'indicators:read',
    'indicators:write',
    'cqi:read',
    'cqi:write',
    'km:read',
    'km:write',
    'news:read',
    'news:write',
    'elearning:read',
    'service-profile:read',
    'service-profile:write',
    'admin:stats',
  ],
  document_manager: [
    'documents:read',
    'documents:write',
    'meetings:read',
    'meetings:write',
    'indicators:read',
    'cqi:read',
    'cqi:write',
    'km:read',
    'km:write',
    'news:read',
    'elearning:read',
    'elearning:write',
    'service-profile:read',
    'service-profile:write',
  ],
  staff: [
    'documents:read',
    'documents:write',
    'meetings:read',
    'meetings:write',
    'indicators:read',
    'cqi:read',
    'cqi:write',
    'km:read',
    'km:write',
    'news:read',
    'elearning:read',
    'elearning:write',
    'service-profile:read',
    'service-profile:write',
  ],
  viewer: [
    'documents:read',
    'meetings:read',
    'indicators:read',
    'cqi:read',
    'km:read',
    'news:read',
    'elearning:read',
    'service-profile:read',
  ],
}

export function getPermissions(role: string): string[] {
  return PERMISSIONS[role as RoleName] ?? PERMISSIONS.viewer
}



export function hasPermission(role: string, permission: string): boolean {
  const perms = getPermissions(role)
  return perms.includes('*') || perms.includes(permission)
}

export function isAdminRole(role: string): boolean {
  return role === 'admin'
}

/** สร้างนัด / จัดการห้องประชุม — ตาม meetings:write (รวม Microsoft 365 ที่ได้ document_manager/staff) */
export function canManageMeetingRooms(role: string): boolean {
  return hasPermission(role, 'meetings:write')
}

export function canWriteMeetings(role: string): boolean {
  return hasPermission(role, 'meetings:write')
}

