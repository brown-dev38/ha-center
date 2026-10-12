import { withRouteHandler } from '@/app/common/server/api-error'
import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return withRouteHandler(async () => {
  await prisma.documentCategory.upsert({
    where: { code: 'GOV' },
    update: {},
    create: {
      code: 'GOV',
      name: 'เอกสารราชการ',
      description: 'คำสั่ง หนังสือเวียน และเอกสารราชการด้านคุณภาพ',
      sortOrder: 8,
    },
  })
  await prisma.documentCategory.upsert({
    where: { code: 'GOV-IN' },
    update: {},
    create: {
      code: 'GOV-IN',
      name: 'หนังสือภายใน',
      description: 'หนังสือเวียน / หนังสือภายในองค์กร',
      sortOrder: 9,
    },
  })
  await prisma.documentCategory.upsert({
    where: { code: 'GOV-OUT' },
    update: {},
    create: {
      code: 'GOV-OUT',
      name: 'หนังสือภายนอก',
      description: 'หนังสือโต้ตอบหน่วยงานภายนอก',
      sortOrder: 10,
    },
  })

  const categories = await prisma.documentCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { documents: { where: { isActive: true } } } } },
  })

  return successResponse(
    categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      documentCount: c._count.documents,
    }))
  )
  })
}
