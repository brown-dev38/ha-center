import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { buildAccessFilter } from '@/app/documents/server/documents-access'
import {
  createDocumentVersion,
  createDocumentVersionFromLink,
  fetchDocumentDetail,
  formatUploader,
  mapDocumentDetail,
  mapVersionFields,
  parseDocumentUploadForm,
  resolveCategoryId,
} from '@/app/documents/server/documents'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission, isAdminRole } from '@/app/common/server/permissions'
import { getOptionalAuth } from '@/app/auth/server/optional-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const skip = (page - 1) * limit

  const { viewerRole } = await getOptionalAuth(request)
  const { allowedLevels } = buildAccessFilter(viewerRole, searchParams.get('access') ?? undefined)

  if (allowedLevels.length === 0) {
    return Response.json({
      success: true,
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    })
  }

  const category = searchParams.get('category')
  const sectionNo = searchParams.get('sectionNo')?.trim() || null
  const search = searchParams.get('search')
  const includeHidden =
    searchParams.get('includeHidden') === 'true' && isAdminRole(viewerRole ?? undefined)

  const where = {
    ...(includeHidden ? {} : { isActive: true }),
    accessLevel: { in: allowedLevels },
    ...(category ? { category: { OR: [{ id: category }, { code: category }] } } : {}),
    ...(sectionNo ? { sectionNo } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { documentNo: { contains: search } },
            { sectionNo: { contains: search } },
          ],
        }
      : {}),
  }

  const [total, documents] = await Promise.all([
    prisma.haDocument.count({ where }),
    prisma.haDocument.findMany({
      where,
      include: {
        category: { select: { id: true, code: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        versions: { where: { isCurrent: true }, take: 1 },
      },
      orderBy: [{ sectionNo: 'asc' }, { documentNo: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
  ])

  const data = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    documentNo: doc.documentNo,
    sectionNo: doc.sectionNo,
    haStandard: doc.haStandard,
    accessLevel: doc.accessLevel,
    category: doc.category,
    uploadedBy: formatUploader(doc.uploadedBy),
    currentVersion: doc.versions[0] ? mapVersionFields(doc.versions[0]) : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    isHidden: !doc.isActive,
  }))

  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  })
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!hasPermission(auth.user.role, 'documents:write')) {
    return errorResponse(403, 'ไม่มีสิทธิ์อัปโหลดเอกสาร', 'AUTH_FORBIDDEN')
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const body = parseDocumentUploadForm(form)
  if (!body.title) return errorResponse(422, 'กรุณาระบุชื่อเอกสาร', 'VALIDATION_ERROR')
  if (!body.categoryId) return errorResponse(422, 'กรุณาเลือกหมวดหมู่', 'VALIDATION_ERROR')
  const linkOnly = isDocumentLinkOnlyMode()
  if (!body.fileUrl && !body.file) {
    return errorResponse(
      422,
      linkOnly ? 'กรุณาแนบลิงก์ Google Drive' : 'กรุณาแนบไฟล์ PDF หรือลิงก์ Google Drive',
      'VALIDATION_ERROR'
    )
  }
  if (linkOnly && body.file) {
    return errorResponse(422, 'โหมดนี้ใช้ลิงก์เอกสารเท่านั้น — ตั้ง DOCUMENT_STORAGE_MODE=link', 'VALIDATION_ERROR')
  }
  if (body.fileUrl && body.file) {
    return errorResponse(422, 'เลือกได้อย่างใดอย่างหนึ่ง: ไฟล์ PDF หรือลิงก์', 'VALIDATION_ERROR')
  }

  const categoryId = await resolveCategoryId(body.categoryId)
  if (!categoryId) {
    return errorResponse(422, 'ไม่พบหมวดหมู่เอกสาร', 'VALIDATION_ERROR')
  }

  const accessLevel = ['public', 'internal', 'confidential'].includes(body.accessLevel)
    ? body.accessLevel
    : 'internal'

  const doc = await prisma.haDocument.create({
    data: {
      title: body.title,
      description: body.description,
      documentNo: body.documentNo,
      sectionNo: body.sectionNo,
      categoryId,
      accessLevel,
      uploadedById: auth.user.id,
    },
  })

  const versionResult = body.fileUrl
    ? await createDocumentVersionFromLink({
        documentId: doc.id,
        fileUrl: body.fileUrl,
        uploadedById: auth.user.id,
      })
    : await createDocumentVersion({
        documentId: doc.id,
        file: body.file!,
        uploadedById: auth.user.id,
      })

  if (!versionResult.ok) {
    await prisma.haDocument.delete({ where: { id: doc.id } })
    return errorResponse(422, versionResult.error, versionResult.code)
  }

  const detail = await fetchDocumentDetail(doc.id)
  return successResponse(mapDocumentDetail(detail!), 'สร้างเอกสารสำเร็จ')
  })
}
