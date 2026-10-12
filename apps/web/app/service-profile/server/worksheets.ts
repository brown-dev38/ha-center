import type { Prisma } from '@prisma/client'
import type { AuthenticatedUser } from '@/app/auth/server/auth-user'
import { hasPermission, isAdminRole } from '@/app/common/server/permissions'
import {
  canCreateWorksheetInDepartment,
  canEditWorksheet as canEditWorksheetAccess,
  canManageAllDepartments,
  canReadWorksheet as canReadWorksheetAccess,
} from '@/app/common/server/resource-access'
import { prisma } from '@/app/common/server/prisma'
import type { UnitProfileWorksheet as WorksheetFormData } from '@/app/service-profile/worksheet-types'
import {
  allocateWorksheetId,
  formatWorksheetVersionId,
  isStructuredWorksheetId,
} from '@/app/service-profile/server/worksheet-id'

const DEFAULT_WORKSHEET_DEPT_CODE = process.env.WORKSHEET_DEFAULT_DEPT_CODE?.trim() || 'GEN'

async function resolveWorksheetDepartment(
  tx: Prisma.TransactionClient,
  departmentId?: string | null,
  userDepartmentId?: string | null
) {
  const targetId = departmentId ?? userDepartmentId
  if (targetId) {
    return tx.department.findUniqueOrThrow({
      where: { id: targetId },
      select: { id: true, code: true },
    })
  }

  const fallback = await tx.department.findUnique({
    where: { code: DEFAULT_WORKSHEET_DEPT_CODE },
    select: { id: true, code: true },
  })
  if (fallback) return fallback

  return tx.department.findFirstOrThrow({
    orderBy: { code: 'asc' },
    select: { id: true, code: true },
  })
}

export type WorksheetStatus = 'draft' | 'submitted' | 'archived'

export type WorksheetListItem = {
  id: string
  departmentId: string
  departmentName: string
  year: number
  title: string
  status: WorksheetStatus
  isHidden: boolean
  preparedById: string
  preparedByName: string
  isMine: boolean
  submittedAt: string | null
  updatedAt: string
  latestVersionNo: number | null
  canEdit: boolean
}

export function canReadWorksheets(user: AuthenticatedUser): boolean {
  return hasPermission(user.role, 'service-profile:read')
}

export function canWriteWorksheets(user: AuthenticatedUser): boolean {
  return hasPermission(user.role, 'service-profile:write')
}

export function canAccessWorksheet(
  user: AuthenticatedUser,
  worksheet: { departmentId: string; preparedById: string; status: string; isHidden?: boolean }
): boolean {
  if (!canReadWorksheets(user)) return false
  if (worksheet.isHidden && !isAdminRole(user.role)) return false
  if (worksheet.status === 'archived' && !isAdminRole(user.role) && user.role !== 'qa_manager') {
    return false
  }
  return canReadWorksheetAccess(user, worksheet)
}

export function canEditWorksheet(
  user: AuthenticatedUser,
  worksheet: { departmentId: string; status: string; preparedById: string }
): boolean {
  if (!canWriteWorksheets(user)) return false
  return canEditWorksheetAccess(user, worksheet)
}

export function deriveWorksheetMeta(formData: WorksheetFormData) {
  const planYear = formData.cqiPlans?.[0]?.year || formData.cqiPlanYear
  const year = Number(planYear) || new Date().getFullYear()
  const title = (formData.unitHeader || formData.unit || `Unit Profile ${year}`).trim()
  return { year, title: title || `Unit Profile ${year}` }
}

export function buildWorksheetWhere(
  user: AuthenticatedUser,
  filters?: { status?: string; year?: number; departmentId?: string; includeHidden?: boolean }
): Prisma.UnitProfileWorksheetWhereInput {
  const where: Prisma.UnitProfileWorksheetWhereInput = {}

  if (filters?.status) where.status = filters.status
  if (filters?.year) where.year = filters.year
  if (!isAdminRole(user.role) || !filters?.includeHidden) {
    where.isHidden = false
  }

  if (canManageAllDepartments(user.role) || user.role === 'document_manager') {
    if (filters?.departmentId) where.departmentId = filters.departmentId
  } else if (user.departmentId) {
    where.departmentId = user.departmentId
  } else {
    where.preparedById = user.id
  }

  return where
}

export async function listWorksheets(
  user: AuthenticatedUser,
  filters?: { status?: string; year?: number; departmentId?: string; includeHidden?: boolean }
) {
  const rows = await prisma.unitProfileWorksheet.findMany({
    where: buildWorksheetWhere(user, filters),
    include: {
      department: { select: { name: true } },
      preparedBy: { select: { firstName: true, lastName: true } },
      versions: { orderBy: { versionNo: 'desc' }, take: 1 },
    },
    orderBy: [{ updatedAt: 'desc' }],
  })

  return rows
    .filter((row) => canAccessWorksheet(user, row))
    .map(
      (row): WorksheetListItem => ({
        id: row.id,
        departmentId: row.departmentId,
        departmentName: row.department.name,
        year: row.year,
        title: row.title,
        status: row.status as WorksheetStatus,
        isHidden: row.isHidden,
        preparedById: row.preparedById,
        preparedByName: `${row.preparedBy.firstName} ${row.preparedBy.lastName}`.trim(),
        isMine: row.preparedById === user.id,
        submittedAt: row.submittedAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
        latestVersionNo: row.versions[0]?.versionNo ?? null,
        canEdit: canEditWorksheet(user, row),
      })
    )
}

export async function getWorksheetById(user: AuthenticatedUser, id: string) {
  const row = await prisma.unitProfileWorksheet.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
      versions: { orderBy: { versionNo: 'desc' } },
    },
  })

  if (!row || !canAccessWorksheet(user, row)) return null
  return row
}

export async function createWorksheet(
  user: AuthenticatedUser,
  formData: WorksheetFormData,
  departmentId?: string
) {
  if (!canWriteWorksheets(user)) {
    throw new Error('FORBIDDEN')
  }

  const { year, title } = deriveWorksheetMeta(formData)

  return prisma.$transaction(async (tx) => {
    // ผู้ใช้ที่ยังไม่มีแผนก (เช่น Microsoft 365) — ไม่รับ departmentId จาก client ป้องกันเลือกแผนกอื่น
    const requestedDepartmentId = canManageAllDepartments(user.role)
      ? departmentId
      : user.departmentId
        ? departmentId ?? user.departmentId
        : null

    const department = await resolveWorksheetDepartment(
      tx,
      requestedDepartmentId,
      user.departmentId
    )

    if (
      !canCreateWorksheetInDepartment(user, department.id, {
        allowUnresolvedDepartment: !user.departmentId,
      })
    ) {
      throw new Error('FORBIDDEN')
    }

    const id = await allocateWorksheetId(tx, department.code, year)

    return tx.unitProfileWorksheet.create({
      data: {
        id,
        departmentId: department.id,
        year,
        title,
        status: 'draft',
        formData: formData as unknown as Prisma.InputJsonValue,
        preparedById: user.id,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        preparedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  })
}

export async function updateWorksheet(
  user: AuthenticatedUser,
  id: string,
  formData: WorksheetFormData
) {
  const existing = await prisma.unitProfileWorksheet.findUnique({ where: { id } })
  if (!existing || !canEditWorksheet(user, existing)) {
    throw new Error('FORBIDDEN')
  }

  const { year, title } = deriveWorksheetMeta(formData)

  return prisma.unitProfileWorksheet.update({
    where: { id },
    data: {
      year,
      title,
      formData: formData as unknown as Prisma.InputJsonValue,
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export async function submitWorksheet(user: AuthenticatedUser, id: string, formData: WorksheetFormData) {
  const existing = await prisma.unitProfileWorksheet.findUnique({
    where: { id },
    include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } },
  })
  if (!existing || !canEditWorksheet(user, existing)) {
    throw new Error('FORBIDDEN')
  }

  const { year, title } = deriveWorksheetMeta(formData)
  const nextVersion = (existing.versions[0]?.versionNo ?? 0) + 1

  return prisma.$transaction(async (tx) => {
    const worksheet = await tx.unitProfileWorksheet.update({
      where: { id },
      data: {
        year,
        title,
        status: 'submitted',
        formData: formData as unknown as Prisma.InputJsonValue,
        submittedAt: new Date(),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        preparedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const version = await tx.unitProfileWorksheetVersion.create({
      data: {
        id: isStructuredWorksheetId(id)
          ? formatWorksheetVersionId(id, nextVersion)
          : `${id}-v${nextVersion}`,
        worksheetId: id,
        versionNo: nextVersion,
        generatedById: user.id,
      },
    })

    return { worksheet, version }
  })
}

export async function setWorksheetHidden(user: AuthenticatedUser, id: string, hidden: boolean) {
  if (!isAdminRole(user.role)) {
    throw new Error('FORBIDDEN')
  }

  const existing = await prisma.unitProfileWorksheet.findUnique({ where: { id } })
  if (!existing) {
    throw new Error('NOT_FOUND')
  }

  return prisma.unitProfileWorksheet.update({
    where: { id },
    data: { isHidden: hidden },
    include: {
      department: { select: { id: true, name: true, code: true } },
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export function mapWorksheetResponse(
  row: {
    id: string
    departmentId: string
    year: number
    title: string
    status: string
    formData: unknown
    submittedAt: Date | null
    createdAt: Date
    updatedAt: Date
    department: { id: string; name: string; code: string }
    preparedBy: { id: string; firstName: string; lastName: string }
  },
  user?: AuthenticatedUser
) {
  return {
    id: row.id,
    departmentId: row.departmentId,
    department: row.department,
    year: row.year,
    title: row.title,
    status: row.status,
    formData: row.formData,
    preparedBy: {
      id: row.preparedBy.id,
      name: `${row.preparedBy.firstName} ${row.preparedBy.lastName}`.trim(),
    },
    submittedAt: row.submittedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(user
      ? {
          canEdit: canEditWorksheet(user, {
            departmentId: row.departmentId,
            status: row.status,
            preparedById: row.preparedBy.id,
          }),
        }
      : {}),
  }
}
