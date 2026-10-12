import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const categories = await prisma.newsCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return successResponse(categories)
}
