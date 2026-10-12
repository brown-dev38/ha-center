import { prisma } from '@/app/common/server/prisma'
import {
  documentLinkFromStorage,
  documentLinkToStorage,
  isDocumentLinkStorage,
  normalizeDocumentLink,
} from '@/app/common/document-link'
import {
  buildDownloadUrl,
  readVersionPdf,
  saveDocumentPdf,
  validatePdfFile,
} from '@/app/documents/server/document-storage'

type VersionRow = {
  id: string
  version: string
  fileName: string
  fileSize: number | null
  filePath: string
  isCurrent: boolean
  createdAt: Date
}

export function mapVersionFields(v: VersionRow) {
  const linked = isDocumentLinkStorage(v.filePath)
  const externalUrl = linked ? documentLinkFromStorage(v.filePath) : undefined
  const normalized = externalUrl ? normalizeDocumentLink(externalUrl) : null

  return {
    id: v.id,
    version: v.version,
    fileName: v.fileName,
    fileSize: v.fileSize,
    isCurrent: v.isCurrent,
    createdAt: v.createdAt.toISOString(),
    source: linked ? ('link' as const) : ('upload' as const),
    externalUrl,
    previewUrl: normalized?.ok ? normalized.previewUrl : externalUrl,
  }
}

export function formatUploader(user: { id: string; firstName: string; lastName: string }) {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
  }
}

export async function fetchDocumentDetail(id: string) {
  return prisma.haDocument.findFirst({
    where: { id, isActive: true },
    include: {
      category: { select: { id: true, code: true, name: true } },
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      versions: {
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })
}

export function mapDocumentDetail(doc: NonNullable<Awaited<ReturnType<typeof fetchDocumentDetail>>>) {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    documentNo: doc.documentNo,
    sectionNo: doc.sectionNo,
    haStandard: doc.haStandard,
    accessLevel: doc.accessLevel,
    isActive: doc.isActive,
    category: doc.category,
    uploadedBy: formatUploader(doc.uploadedBy),
    versions: doc.versions.map((v) => ({
      ...mapVersionFields(v),
      mimeType: v.mimeType,
      changeNote: v.changeNote,
      uploadedBy: formatUploader(v.uploadedBy),
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function logDocumentDownload(params: {
  documentId: string
  versionId: string
  userId?: string
  ipAddress?: string
  userAgent?: string | null
}) {
  await prisma.documentDownloadLog.create({
    data: {
      documentId: params.documentId,
      versionId: params.versionId,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

export async function nextVersionLabel(documentId: string): Promise<string> {
  const count = await prisma.documentVersion.count({ where: { documentId } })
  return `v${count + 1}`
}

export async function createDocumentVersion(params: {
  documentId: string
  file: File
  uploadedById: string
  changeNote?: string
}) {
  const validation = validatePdfFile(params.file)
  if (!validation.valid) {
    return { ok: false as const, error: validation.error, code: validation.code }
  }

  const versionLabel = await nextVersionLabel(params.documentId)
  const saved = await saveDocumentPdf({
    documentId: params.documentId,
    versionLabel,
    file: params.file,
  })
  if (!saved.ok) {
    return saved
  }

  await prisma.documentVersion.updateMany({
    where: { documentId: params.documentId, isCurrent: true },
    data: { isCurrent: false },
  })

  const version = await prisma.documentVersion.create({
    data: {
      documentId: params.documentId,
      version: versionLabel,
      fileUrl: saved.fileUrl,
      filePath: saved.filePath,
      fileData: saved.fileData,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      mimeType: 'application/pdf',
      uploadedById: params.uploadedById,
      changeNote: params.changeNote,
      isCurrent: true,
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return { ok: true as const, version }
}

export async function createDocumentVersionFromLink(params: {
  documentId: string
  fileUrl: string
  uploadedById: string
  changeNote?: string
}) {
  const parsed = normalizeDocumentLink(params.fileUrl)
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error, code: parsed.code }
  }

  const versionLabel = await nextVersionLabel(params.documentId)

  await prisma.documentVersion.updateMany({
    where: { documentId: params.documentId, isCurrent: true },
    data: { isCurrent: false },
  })

  const version = await prisma.documentVersion.create({
    data: {
      documentId: params.documentId,
      version: versionLabel,
      fileUrl: parsed.previewUrl,
      filePath: documentLinkToStorage(parsed.url),
      fileData: null,
      fileName: parsed.fileName,
      fileSize: null,
      mimeType: 'application/pdf',
      uploadedById: params.uploadedById,
      changeNote: params.changeNote,
      isCurrent: true,
    },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return { ok: true as const, version }
}

export async function readDocumentVersionPdf(version: {
  filePath: string
  fileData: Buffer | Uint8Array | null
}) {
  return readVersionPdf(version)
}

export async function resolveCategoryId(categoryIdOrCode: string) {
  const category = await prisma.documentCategory.findFirst({
    where: {
      isActive: true,
      OR: [{ id: categoryIdOrCode }, { code: categoryIdOrCode }],
    },
  })
  return category?.id ?? null
}

export function parseDocumentUploadForm(form: FormData) {
  const title = String(form.get('title') ?? '').trim()
  const description = String(form.get('description') ?? '').trim() || undefined
  const documentNo = String(form.get('documentNo') ?? '').trim() || undefined
  const sectionNo = String(form.get('sectionNo') ?? '').trim() || undefined
  const categoryId = String(form.get('categoryId') ?? '').trim()
  const accessLevel = String(form.get('accessLevel') ?? 'internal').trim()
  const changeNote = String(form.get('changeNote') ?? '').trim() || undefined
  const fileUrl = String(form.get('fileUrl') ?? '').trim() || undefined
  const file = form.get('file')

  return {
    title,
    description,
    documentNo,
    sectionNo,
    categoryId,
    accessLevel,
    changeNote,
    fileUrl,
    file: file instanceof File && file.size > 0 ? file : null,
  }
}
