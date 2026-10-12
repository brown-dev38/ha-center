import { NextRequest } from 'next/server'
import { errorResponse, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { hasPermission } from '@/app/common/server/permissions'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const items = await prisma.news.findMany({
    where: {
      ...(searchParams.get('published') === 'true' ? { isPublished: true } : {}),
      ...(searchParams.get('categoryId') ? { categoryId: searchParams.get('categoryId')! } : {}),
    },
    include: {
      category: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: Number(searchParams.get('limit') ?? 50),
  })
  return successResponse(items)
}

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

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')
  if (!hasPermission(auth.user.role, 'news:write')) {
    return errorResponse(403, 'ไม่มีสิทธิ์เข้าถึง', 'AUTH_FORBIDDEN')
  }

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

  if (!body.title || !body.slug || !body.content || !body.categoryId) {
    return errorResponse(422, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
  }

  const category = await prisma.newsCategory.findFirst({
    where: { id: body.categoryId, isActive: true },
  })
  if (!category) return errorResponse(422, 'ไม่พบหมวดหมู่ข่าว', 'NEWS_CATEGORY_NOT_FOUND')

  const slug = await ensureUniqueSlug(body.slug)
  const item = await prisma.news.create({
    data: {
      title: body.title.trim(),
      slug,
      content: body.content,
      excerpt: body.excerpt?.trim() || null,
      categoryId: category.id,
      authorId: auth.user.id,
      isPublished: body.isPublished ?? false,
      publishedAt: body.isPublished ? new Date() : null,
    },
    include: {
      category: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return successResponse(item, 'สร้างข่าวสำเร็จ')
}
