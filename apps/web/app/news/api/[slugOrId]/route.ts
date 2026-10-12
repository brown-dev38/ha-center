import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { getOptionalAuth } from '@/app/auth/server/optional-auth'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slugOrId: string }> }

async function ensureUniqueSlug(base: string, excludeId?: string) {
  const normalized = base.trim().slice(0, 80) || `news-${Date.now()}`
  let slug = normalized
  let suffix = 0
  for (;;) {
    const found = await prisma.news.findUnique({ where: { slug } })
    if (!found || found.id === excludeId) break
    suffix += 1
    slug = `${normalized}-${suffix}`
  }
  return slug
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { slugOrId } = await ctx.params
  const { user } = await getOptionalAuth(request)

  const item = await prisma.news.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: {
      category: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!item) return errorResponse(404, 'ไม่พบข่าว', 'NEWS_NOT_FOUND')

  const canViewDraft = user && hasPermission(user.role, 'news:write')
  if (!item.isPublished && !canViewDraft) {
    return errorResponse(404, 'ไม่พบข่าว', 'NEWS_NOT_FOUND')
  }

  return successResponse(item)
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!hasPermission(auth.user.role, 'news:write')) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

  const { slugOrId } = await ctx.params
  const existing = await prisma.news.findUnique({ where: { id: slugOrId } })
  if (!existing) return errorResponse(404, 'ไม่พบข่าว', 'NEWS_NOT_FOUND')

  let body: {
    title?: string
    slug?: string
    content?: string
    excerpt?: string
    categoryId?: string
    isPublished?: boolean
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const category = body.categoryId
    ? await prisma.newsCategory.findFirst({ where: { id: body.categoryId, isActive: true } })
    : null
  if (body.categoryId && !category) {
    return errorResponse(422, 'ไม่พบหมวดหมู่ข่าว', 'NEWS_CATEGORY_NOT_FOUND')
  }

  const slug = body.slug ? await ensureUniqueSlug(body.slug, existing.id) : existing.slug
  const isPublished = body.isPublished ?? existing.isPublished

  const item = await prisma.news.update({
    where: { id: existing.id },
    data: {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.slug !== undefined ? { slug } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.excerpt !== undefined ? { excerpt: body.excerpt?.trim() || null } : {}),
      ...(category ? { categoryId: category.id } : {}),
      isPublished,
      publishedAt:
        isPublished && !existing.publishedAt
          ? new Date()
          : !isPublished
            ? null
            : existing.publishedAt,
    },
    include: {
      category: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return successResponse(item, 'บันทึกข่าวสำเร็จ')
}
