import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { canAccessLevel } from '@/app/documents/server/documents-access'
import {
  createDocumentVersion,
  createDocumentVersionFromLink,
  fetchDocumentDetail,
  mapDocumentDetail,
  parseDocumentUploadForm,
  resolveCategoryId,
} from '@/app/documents/server/documents'
import { getOptionalAuth } from '@/app/auth/server/optional-auth'
import { hasPermission } from '@/app/common/server/permissions'
import { canEditHaDocument } from '@/app/common/server/resource-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const { viewerRole } = await getOptionalAuth(request)
  const doc = await fetchDocumentDetail(id)

  if (!doc) return errorResponse(404, 'ไม่พบเอกสาร', 'DOCUMENT_NOT_FOUND')
  if (!canAccessLevel(viewerRole, doc.accessLevel)) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึงเอกสาร', 'DOCUMENT_ACCESS_DENIED')
  }

  return successResponse(mapDocumentDetail(doc))
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!hasPermission(auth.user.role, 'documents:write')) {
    return errorResponse(403, 'ไม่มีสิทธิ์แก้ไขเอกสาร', 'AUTH_FORBIDDEN')
  }

  const existing = await prisma.haDocument.findFirst({
    where: { id, isActive: true },
    select: { id: true, uploadedById: true },
  })
  if (!existing) return errorResponse(404, 'ไม่พบเอกสาร', 'DOCUMENT_NOT_FOUND')
  if (!canEditHaDocument(auth.user, existing)) {
    return errorResponse(403, 'แก้ไขได้เฉพาะเอกสารของตัวเอง หรือติดต่อทีมจัดการเอกสาร', 'AUTH_FORBIDDEN')
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const body = parseDocumentUploadForm(form)
  const categoryId = body.categoryId ? await resolveCategoryId(body.categoryId) : undefined
  if (body.categoryId && !categoryId) {
    return errorResponse(422, 'ไม่พบหมวดหมู่เอกสาร', 'VALIDATION_ERROR')
  }

  const accessLevel =
    body.accessLevel && ['public', 'internal', 'confidential'].includes(body.accessLevel)
      ? body.accessLevel
      : undefined

  await prisma.haDocument.update({
    where: { id },
    data: {
      ...(body.title ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.documentNo !== undefined ? { documentNo: body.documentNo || null } : {}),
      ...(body.sectionNo !== undefined ? { sectionNo: body.sectionNo || null } : {}),
      ...(accessLevel ? { accessLevel } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
  })

  if (body.fileUrl && body.file) {
    return errorResponse(422, 'เลือกได้อย่างใดอย่างหนึ่ง: ไฟล์ PDF หรือลิงก์', 'VALIDATION_ERROR')
  }
  if (body.file && isDocumentLinkOnlyMode()) {
    return errorResponse(422, 'โหมดนี้ใช้ลิงก์เอกสารเท่านั้น', 'VALIDATION_ERROR')
  }
  if (body.fileUrl) {
    const versionResult = await createDocumentVersionFromLink({
      documentId: id,
      fileUrl: body.fileUrl,
      uploadedById: auth.user.id,
      changeNote: body.changeNote,
    })
    if (!versionResult.ok) {
      return errorResponse(422, versionResult.error, versionResult.code)
    }
  } else if (body.file) {
    const versionResult = await createDocumentVersion({
      documentId: id,
      file: body.file,
      uploadedById: auth.user.id,
      changeNote: body.changeNote,
    })
    if (!versionResult.ok) {
      return errorResponse(422, versionResult.error, versionResult.code)
    }
  }

  const detail = await fetchDocumentDetail(id)
  return successResponse(mapDocumentDetail(detail!), 'อัปเดตเอกสารสำเร็จ')
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (auth.user.role !== 'admin') {
    return errorResponse(403, 'เฉพาะผู้ดูแลระบบเท่านั้น', 'AUTH_FORBIDDEN')
  }

  const existing = await prisma.haDocument.findFirst({
    where: { id, isActive: true },
  })
  if (!existing) return errorResponse(404, 'ไม่พบเอกสาร', 'DOCUMENT_NOT_FOUND')

  await prisma.haDocument.update({
    where: { id },
    data: { isActive: false },
  })

  return successResponse(null, 'ซ่อนเอกสารแล้ว — ผู้ใช้ทั่วไปจะไม่เห็นในรายการ')
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (auth.user.role !== 'admin') {
    return errorResponse(403, 'เฉพาะผู้ดูแลระบบเท่านั้น', 'AUTH_FORBIDDEN')
  }

  let body: { restore?: boolean }
  try {
    body = (await request.json()) as { restore?: boolean }
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }
  if (body.restore !== true) {
    return errorResponse(400, 'คำขอไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const existing = await prisma.haDocument.findFirst({
    where: { id, isActive: false },
  })
  if (!existing) return errorResponse(404, 'ไม่พบเอกสารที่ซ่อนอยู่', 'DOCUMENT_NOT_FOUND')

  await prisma.haDocument.update({
    where: { id },
    data: { isActive: true },
  })

  return successResponse(null, 'แสดงเอกสารอีกครั้งแล้ว')
}
