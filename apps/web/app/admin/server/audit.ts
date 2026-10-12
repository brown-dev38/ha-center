import { Prisma } from '@prisma/client'
import { prisma } from '@/app/common/server/prisma'

type AuditParams = {
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      oldData: (params.oldData ?? undefined) as Prisma.InputJsonValue | undefined,
      newData: (params.newData ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  })
}
