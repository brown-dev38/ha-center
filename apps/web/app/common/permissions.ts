/** สิทธิ์ตาม role — ใช้ทั้งฝั่ง API และ UI */

export type AppRole = 'admin' | 'qa_manager' | 'document_manager' | 'staff' | 'viewer'

const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
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

export function getPermissionsForRole(role?: string | null): string[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role as AppRole] ?? ROLE_PERMISSIONS.viewer
}

export function hasPermission(
  role?: string | null,
  permission?: string,
  explicitPermissions?: string[] | null
): boolean {
  if (!permission) return true
  const perms = explicitPermissions ?? getPermissionsForRole(role)
  return perms.includes('*') || perms.includes(permission)
}

export function hasAnyPermission(
  role?: string | null,
  permissions?: string[],
  explicitPermissions?: string[] | null
): boolean {
  if (!permissions?.length) return true
  return permissions.some((p) => hasPermission(role, p, explicitPermissions))
}

export function canReadDocuments(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'documents:read', perms)
}

export function canWriteDocuments(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'documents:write', perms)
}

export function canDeleteDocuments(role?: string | null) {
  return role?.trim().toLowerCase() === 'admin'
}

export function canWriteNews(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'news:write', perms)
}

export function canWriteMeetings(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'meetings:write', perms)
}

/**
 * จัดการห้องประชุม + สร้าง/แก้จองประชุม
 * — role ที่มี meetings:write (รวม staff / document_manager ที่ login Microsoft 365)
 */
export function canManageMeetingRooms(role?: string | null, perms?: string[] | null) {
  return canWriteMeetings(role, perms)
}

export function canWriteIndicators(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'indicators:write', perms)
}

export function canWriteKm(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'km:write', perms)
}

/** เรียน ทำแบบทดสอบ บันทึกความคืบหน้า (staff+) */
export function canLearnElearning(role?: string | null, perms?: string[] | null) {
  return hasPermission(role, 'elearning:write', perms)
}

export function isAdmin(role?: string | null) {
  return role?.trim().toLowerCase() === 'admin'
}

/** จัดการเอกสารองค์กร (คลัง HA / HA v6 tracker) */
export function canManageOrgDocuments(role?: string | null) {
  const r = role?.trim().toLowerCase()
  return r === 'admin' || r === 'qa_manager' || r === 'document_manager'
}

/** ดูข้อมูลข้ามแผนก */
export function canManageAllDepartments(role?: string | null) {
  const r = role?.trim().toLowerCase()
  return r === 'admin' || r === 'qa_manager'
}

/** แก้เอกสารในคลัง — ผู้จัดการองค์กรแก้ได้ทุกฉบับ, คนอื่นแก้เฉพาะที่ตัวเองอัปโหลด */
export function canEditHaDocumentClient(
  role?: string | null,
  uploadedById?: string | null,
  currentUserId?: string | null
) {
  if (!hasPermission(role, 'documents:write')) return false
  if (canManageOrgDocuments(role)) return true
  return !!uploadedById && !!currentUserId && uploadedById === currentUserId
}

/** ป้าย role ภาษาไทย */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  qa_manager: 'ผู้จัดการคุณภาพ',
  document_manager: 'ผู้จัดการเอกสาร',
  staff: 'เจ้าหน้าที่',
  viewer: 'ผู้เข้าชม',
}
