'use client'

import { useMe } from '@/hooks/use-me'
import { useAuthUser } from '@/app/common/use-auth'
import {
  canDeleteDocuments,
  canReadDocuments,
  canWriteDocuments,
  canWriteIndicators,
  canWriteKm,
  canLearnElearning,
  canWriteMeetings,
  canManageMeetingRooms,
  canManageOrgDocuments,
  canManageAllDepartments,
  canEditHaDocumentClient,
  canWriteNews,
  getPermissionsForRole,
  hasAnyPermission,
  hasPermission,
  isAdmin,
  ROLE_LABELS,
} from '@/app/common/permissions'

export function usePermissions() {
  const sessionUser = useAuthUser()
  const { data: me, isLoading } = useMe()

  const role = me?.role ?? sessionUser?.role
  const permissions = me?.permissions ?? getPermissionsForRole(role)

  return {
    role,
    permissions,
    isLoading,
    roleLabel: ROLE_LABELS[role ?? ''] ?? role,
    hasPermission: (p: string) => hasPermission(role, p, permissions),
    hasAnyPermission: (ps: string[]) => hasAnyPermission(role, ps, permissions),
    canReadDocuments: () => canReadDocuments(role, permissions),
    canWriteDocuments: () => canWriteDocuments(role, permissions),
    canDeleteDocuments: () => canDeleteDocuments(role),
    canWriteNews: () => canWriteNews(role, permissions),
    canWriteMeetings: () => canWriteMeetings(role, permissions),
    canManageMeetingRooms: () => canManageMeetingRooms(role, permissions),
    canWriteIndicators: () => canWriteIndicators(role, permissions),
    canWriteKm: () => canWriteKm(role, permissions),
    canLearnElearning: () => canLearnElearning(role, permissions),
    canManageOrgDocuments: () => canManageOrgDocuments(role),
    canManageAllDepartments: () => canManageAllDepartments(role),
    canEditHaDocument: (uploadedById?: string | null) =>
      canEditHaDocumentClient(role, uploadedById, me?.id ?? sessionUser?.id),
    isAdmin: () => isAdmin(role),
  }
}
