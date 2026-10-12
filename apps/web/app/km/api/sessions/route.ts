import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { withRouteHandler } from '@/app/common/server/api-error'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { isFileLinkMode } from '@/app/auth/server/file-link-mode'
import { hasPermission } from '@/app/common/server/permissions'
import { mapKmSession, saveKmSessionPdf } from '@/app/km/server/km'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const skip = (page - 1) * limit
  const year = searchParams.get('year')
  const search = searchParams.get('search')

  const where = {
    isActive: true,
    ...(year ? { fiscalYear: Number(year) } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  }

  const [total, sessions] = await Promise.all([
    prisma.kmSession.count({ where }),
    prisma.kmSession.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        presenter: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { results: true } },
      },
      orderBy: { sessionDate: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return Response.json({
    success: true,
    data: sessions.map(mapKmSession),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  })
}

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
    if (!hasPermission(auth.user.role, 'km:write')) {
      return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
    }

    const form = await request.formData()
    const title = String(form.get('title') ?? '').trim()
    const sessionDate = String(form.get('sessionDate') ?? '').trim()
    const fiscalYear = Number(form.get('fiscalYear') ?? '')
    const facilitatorId = String(form.get('facilitatorId') ?? '').trim()
    const file = form.get('file')
    const fileUrl = String(form.get('fileUrl') ?? '').trim()
    const linkOnly = isFileLinkMode('km')

    if (!title || !sessionDate || !Number.isFinite(fiscalYear) || !facilitatorId) {
      return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
    }
    if (linkOnly && file instanceof File && file.size > 0) {
      return errorResponse(422, 'โหมด KM ใช้แนบลิงก์ Google Drive เท่านั้น', 'KM_LINK_ONLY')
    }
    if (fileUrl && file instanceof File && file.size > 0) {
      return errorResponse(422, 'เลือกได้เฉพาะลิงก์หรือไฟล์อย่างใดอย่างหนึ่ง', 'VALIDATION_ERROR')
    }

    const session = await prisma.kmSession.create({
      data: {
        title,
        sessionDate: new Date(sessionDate),
        fiscalYear,
        presenterId: facilitatorId,
        status: 'planned',
      },
    })

    if (fileUrl) {
      const stored = saveKmSessionFromLink(fileUrl)
      if (!stored.ok) {
        await prisma.kmSession.delete({ where: { id: session.id } })
        return errorResponse(422, stored.error, stored.code)
      }
      await prisma.kmSession.update({
        where: { id: session.id },
        data: {
          filePath: stored.filePath,
          fileName: stored.fileName,
          fileSize: stored.fileSize,
          fileData: stored.fileData,
        },
      })
    } else if (file instanceof File && file.size > 0) {
      const stored = await saveKmSessionPdf(session.id, file)
      if (!stored.ok) {
        await prisma.kmSession.delete({ where: { id: session.id } })
        return errorResponse(422, stored.error, stored.code)
      }
      await prisma.kmSession.update({
        where: { id: session.id },
        data: {
          filePath: stored.filePath,
          fileName: stored.fileName,
          fileSize: stored.fileSize,
          fileData: stored.fileData,
        },
      })
    }

    const detail = await prisma.kmSession.findUnique({
      where: { id: session.id },
      include: {
        department: { select: { id: true, name: true } },
        presenter: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { results: true } },
      },
    })

    return successResponse(mapKmSession(detail!), 'สร้าง KM Session สำเร็จ')
  })
}
