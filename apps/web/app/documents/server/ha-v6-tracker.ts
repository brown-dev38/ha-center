import type { Prisma } from '@prisma/client'
import type { AuthenticatedUser } from '@/app/auth/server/auth-user'
import { readStoredBinary, saveToConfiguredStorage } from '@/app/auth/server/stored-file'
import { canManageOrgDocuments } from '@/app/common/server/resource-access'
import { prisma } from '@/app/common/server/prisma'
import { useGoogleDriveForFiles } from '@/app/common/server/deployment'
import { hasPermission, isAdminRole } from '@/app/common/server/permissions'
import type {
  HaV6DocStatus,
  HaV6StorageFileItem,
  HaV6StorageItem,
} from '@/app/documents/ha-v6-tracker-types'
import { defaultProgressForStatus } from '@/app/documents/ha-v6-tracker-types'

const DB_INLINE_PATH = 'db:inline'
const MAX_FILE_SIZE = 50 * 1024 * 1024

const ALLOWED_STATUSES = new Set<HaV6DocStatus>([
  'not_started',
  'in_progress',
  'review',
  'completed',
])

export type HaV6ServerState = {
  documentId: string
  status: HaV6DocStatus
  progressPercent: number
  storageItems: HaV6StorageItem[]
  remarks: string
  updatedAt: string
  updatedById: string | null
}

export function canReadHaV6Tracker(user: AuthenticatedUser): boolean {
  return hasPermission(user.role, 'documents:read')
}

export function canWriteHaV6Tracker(user: AuthenticatedUser): boolean {
  return canManageOrgDocuments(user.role)
}

/** ลบ / ซ่อน ไฟล์ในคลัง HA v6 — เฉพาะผู้ดูแลระบบ */
export function canAdminHaV6Storage(user: AuthenticatedUser): boolean {
  return isAdminRole(user.role)
}

function parseStorageItems(raw: unknown): HaV6StorageItem[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): HaV6StorageItem[] => {
    if (!item || typeof item !== 'object') return []
    const kind = (item as { kind?: string }).kind
    if (kind !== 'link' && kind !== 'file') return []
    return [{ ...(item as HaV6StorageItem), hidden: Boolean((item as { hidden?: boolean }).hidden) }]
  })
}

function isAdminOnlyStorageChange(
  previous: HaV6StorageItem[],
  next: HaV6StorageItem[]
): boolean {
  const prevById = new Map(previous.map((item) => [item.id, item]))
  for (const prev of previous) {
    const found = next.find((item) => item.id === prev.id)
    if (!found) return true // ลบรายการ
  }
  for (const item of next) {
    const was = prevById.get(item.id)
    if (item.hidden && !was?.hidden) return true // ซ่อนใหม่
    if (was?.hidden && !item.hidden) return true // ยกเลิกซ่อน
  }
  return false
}

function mapState(row: {
  documentId: string
  status: string
  progressPercent: number
  storageItems: unknown
  remarks: string
  updatedAt: Date
  updatedById: string | null
}): HaV6ServerState {
  return {
    documentId: row.documentId,
    status: (ALLOWED_STATUSES.has(row.status as HaV6DocStatus)
      ? row.status
      : 'not_started') as HaV6DocStatus,
    progressPercent: Math.min(100, Math.max(0, row.progressPercent || 0)),
    storageItems: parseStorageItems(row.storageItems),
    remarks: row.remarks ?? '',
    updatedAt: row.updatedAt.toISOString(),
    updatedById: row.updatedById,
  }
}

export async function listHaV6DocumentStates(): Promise<Record<string, HaV6ServerState>> {
  const model = (prisma as { haV6DocumentState?: typeof prisma.haV6DocumentState }).haV6DocumentState
  if (!model) {
    throw new Error(
      "Cannot read properties of undefined (reading 'findMany') — รัน prisma generate และ db push"
    )
  }
  const rows = await model.findMany()
  return Object.fromEntries(rows.map((row) => [row.documentId, mapState(row)]))
}

export async function upsertHaV6DocumentState(
  user: AuthenticatedUser,
  documentId: string,
  patch: {
    status?: HaV6DocStatus
    progressPercent?: number
    storageItems?: HaV6StorageItem[]
    remarks?: string
  }
): Promise<HaV6ServerState> {
  const id = documentId.trim()
  if (!id) throw new Error('VALIDATION_ERROR')

  const existing = await prisma.haV6DocumentState.findUnique({ where: { documentId: id } })

  let nextStatus: HaV6DocStatus =
    (existing?.status as HaV6DocStatus | undefined) ?? 'not_started'
  if (patch.status !== undefined) {
    if (!ALLOWED_STATUSES.has(patch.status)) throw new Error('VALIDATION_ERROR')
    nextStatus = patch.status
  }

  let nextProgress =
    existing?.progressPercent ??
    defaultProgressForStatus(nextStatus)
  if (patch.progressPercent !== undefined) {
    nextProgress = Math.min(100, Math.max(0, Number(patch.progressPercent) || 0))
  } else if (patch.status !== undefined && existing?.status !== patch.status) {
    nextProgress = defaultProgressForStatus(nextStatus)
  }

  const prevStorageItems = parseStorageItems(existing?.storageItems)
  const nextStorageItems =
    patch.storageItems !== undefined
      ? patch.storageItems
      : prevStorageItems
  const nextRemarks = patch.remarks !== undefined ? patch.remarks : (existing?.remarks ?? '')

  if (
    patch.storageItems !== undefined &&
    isAdminOnlyStorageChange(prevStorageItems, nextStorageItems) &&
    !canAdminHaV6Storage(user)
  ) {
    throw new Error('ADMIN_REQUIRED')
  }

  if (existing && patch.storageItems) {
    const nextFileIds = new Set(
      nextStorageItems.filter((i): i is HaV6StorageFileItem => i.kind === 'file').map((i) => i.fileId)
    )
    const orphanFiles = await prisma.haV6TrackerFile.findMany({
      where: { documentId: id },
      select: { id: true },
    })
    const toDelete = orphanFiles.filter((f) => !nextFileIds.has(f.id)).map((f) => f.id)
    if (toDelete.length > 0) {
      if (!canAdminHaV6Storage(user)) throw new Error('ADMIN_REQUIRED')
      await prisma.haV6TrackerFile.deleteMany({ where: { id: { in: toDelete } } })
    }
  }

  const row = await prisma.haV6DocumentState.upsert({
    where: { documentId: id },
    create: {
      documentId: id,
      status: nextStatus,
      progressPercent: nextProgress,
      storageItems: nextStorageItems as unknown as Prisma.InputJsonValue,
      remarks: nextRemarks,
      updatedById: user.id,
    },
    update: {
      status: nextStatus,
      progressPercent: nextProgress,
      storageItems: nextStorageItems as unknown as Prisma.InputJsonValue,
      remarks: nextRemarks,
      updatedById: user.id,
    },
  })

  return mapState(row)
}

export async function bulkUpsertHaV6DocumentStates(
  user: AuthenticatedUser,
  states: Array<{
    documentId: string
    status?: HaV6DocStatus
    progressPercent?: number
    storageItems?: HaV6StorageItem[]
    remarks?: string
  }>
): Promise<Record<string, HaV6ServerState>> {
  const result: Record<string, HaV6ServerState> = {}
  for (const state of states) {
    if (!state.documentId?.trim()) continue
    // Skip migrating local IndexedDB file blobs — only links + status/progress/remarks
    const items = (state.storageItems ?? []).filter((item) => item.kind === 'link')
    result[state.documentId] = await upsertHaV6DocumentState(user, state.documentId, {
      status: state.status,
      progressPercent: state.progressPercent,
      remarks: state.remarks,
      storageItems: state.storageItems ? items : undefined,
    })
  }
  return result
}

export async function saveHaV6TrackerFile(params: {
  user: AuthenticatedUser
  documentId: string
  file: File
}): Promise<HaV6StorageFileItem> {
  const documentId = params.documentId.trim()
  if (!documentId) throw new Error('VALIDATION_ERROR')
  if (!params.file || params.file.size === 0) throw new Error('DOCUMENT_INVALID_FILE')
  if (params.file.size > MAX_FILE_SIZE) throw new Error('DOCUMENT_FILE_TOO_LARGE')

  await prisma.haV6DocumentState.upsert({
    where: { documentId },
    create: {
      documentId,
      status: 'not_started',
      progressPercent: 0,
      storageItems: [],
      remarks: '',
      updatedById: params.user.id,
    },
    update: { updatedById: params.user.id },
  })

  const buffer = Buffer.from(await params.file.arrayBuffer())
  const mimeType = params.file.type || 'application/octet-stream'
  const fileName = params.file.name || 'attachment'

  let filePath = DB_INLINE_PATH
  let fileData: Buffer | null = buffer

  if (useGoogleDriveForFiles()) {
    const stored = await saveToConfiguredStorage({
      subfolder: `ha-center/ha-v6/${documentId}`,
      fileName,
      mimeType,
      buffer,
    })
    filePath = stored.filePath
    fileData = stored.fileData
  }

  const row = await prisma.haV6TrackerFile.create({
    data: {
      documentId,
      fileName,
      mimeType,
      fileSize: params.file.size,
      filePath,
      fileData: fileData ?? undefined,
      uploadedById: params.user.id,
    },
  })

  return {
    id: row.id,
    kind: 'file',
    fileId: row.id,
    fileName: row.fileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    addedAt: row.createdAt.toISOString(),
  }
}

export async function getHaV6TrackerFile(fileId: string) {
  return prisma.haV6TrackerFile.findUnique({ where: { id: fileId } })
}

export async function readHaV6TrackerFileBuffer(file: {
  filePath: string
  fileData: Buffer | Uint8Array | null
}): Promise<Buffer> {
  return readStoredBinary({
    filePath: file.filePath,
    fileData: file.fileData,
    inlineMarkers: [DB_INLINE_PATH],
  })
}

export async function deleteHaV6TrackerFile(fileId: string) {
  await prisma.haV6TrackerFile.delete({ where: { id: fileId } }).catch(() => null)
}
