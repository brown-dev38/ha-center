import type { AuthenticatedUser } from '@/app/auth/server/auth-user'

/** ดู/จัดการข้ามแผนกได้ — ทีมนำคุณภาพและผู้ดูแลระบบ */
export function canManageAllDepartments(role: string): boolean {
  const r = role.trim().toLowerCase()
  return r === 'admin' || r === 'qa_manager'
}

/** จัดการเอกสารองค์กร (คลังเอกสาร HA / HA v6 tracker) */
export function canManageOrgDocuments(role: string): boolean {
  const r = role.trim().toLowerCase()
  return r === 'admin' || r === 'qa_manager' || r === 'document_manager'
}

export function isSameDepartment(
  userDepartmentId: string | null | undefined,
  resourceDepartmentId: string
): boolean {
  return !!userDepartmentId && userDepartmentId === resourceDepartmentId
}

export function isResourceOwner(userId: string, ownerId: string): boolean {
  return userId === ownerId
}

/** อ่าน worksheet — ทีมนำดูทุกแผนก, เจ้าหน้าที่ดูเฉพาะแผนกตัวเอง */
export function canReadWorksheet(
  user: AuthenticatedUser,
  worksheet: { departmentId: string; preparedById: string; status: string }
): boolean {
  if (canManageAllDepartments(user.role) || canManageOrgDocuments(user.role)) return true
  if (isResourceOwner(user.id, worksheet.preparedById)) return true
  return isSameDepartment(user.departmentId, worksheet.departmentId)
}

/**
 * แก้ worksheet ได้เฉพาะแบบร่าง
 * - ทีมนำ/แอดมินแก้ข้ามแผนกได้
 * - คนอื่นแก้ได้เฉพาะเอกสารของตัวเอง (รวม Microsoft 365 ที่ยังไม่มีแผนก)
 */
export function canEditWorksheet(
  user: AuthenticatedUser,
  worksheet: { departmentId: string; preparedById: string; status: string }
): boolean {
  if (worksheet.status !== 'draft') return false
  if (canManageAllDepartments(user.role)) return true
  return isResourceOwner(user.id, worksheet.preparedById)
}

/**
 * สร้าง worksheet ในแผนกที่กำหนด
 * - ทีมนำ/แอดมินสร้างได้ทุกแผนก
 * - มีแผนกแล้ว → สร้างได้เฉพาะแผนกตัวเอง
 * - ยังไม่มีแผนก (เช่น Microsoft 365) → สร้างได้เฉพาะแผนกที่ระบบกำหนดให้ (caller ต้องไม่รับ departmentId จากผู้ใช้)
 */
export function canCreateWorksheetInDepartment(
  user: AuthenticatedUser,
  departmentId: string,
  options?: { allowUnresolvedDepartment?: boolean }
): boolean {
  if (canManageAllDepartments(user.role)) return true
  if (!user.departmentId) {
    return options?.allowUnresolvedDepartment === true && !!departmentId
  }
  return user.departmentId === departmentId
}

/** แก้เอกสารในคลัง HA — ผู้จัดการองค์กรแก้ได้ทุกฉบับ, คนอื่นแก้เฉพาะที่ตัวเองอัปโหลด */
export function canEditHaDocument(
  user: AuthenticatedUser,
  document: { uploadedById: string }
): boolean {
  if (canManageOrgDocuments(user.role)) return true
  return isResourceOwner(user.id, document.uploadedById)
}
