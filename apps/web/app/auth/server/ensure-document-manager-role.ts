import { prisma } from '@/app/common/server/prisma'

export type UserWithRole = {
  id: string
  roleId: string
  role: { name: string }
}

const PRESERVED_ROLES = new Set(['admin', 'qa_manager'])
const MICROSOFT_DOC_MANAGER_ROLE = 'document_manager'

/**
 * ผู้ใช้ Microsoft ได้สิทธิ์จัดการ/อัปโหลดเอกสาร HA
 * ไม่เปลี่ยน admin / qa_manager ที่มีอยู่แล้ว
 */
export async function ensureDocumentManagerRole<T extends UserWithRole>(
  user: T,
  include?: Record<string, unknown>
): Promise<T> {
  if (PRESERVED_ROLES.has(user.role.name)) return user
  if (user.role.name === MICROSOFT_DOC_MANAGER_ROLE) return user

  const docManagerRole = await prisma.role.findUnique({
    where: { name: MICROSOFT_DOC_MANAGER_ROLE },
  })
  if (!docManagerRole) return user

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { roleId: docManagerRole.id },
    include: include ?? { role: true, department: true },
  })

  return updated as T
}
