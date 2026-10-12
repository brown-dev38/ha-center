import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  })

  const data = await Promise.all(
    departments.map(async (dept) => {
      const [total, completed, outstanding] = await Promise.all([
        prisma.cqiProject.count({ where: { departmentId: dept.id, isActive: true } }),
        prisma.cqiProject.count({
          where: { departmentId: dept.id, isActive: true, status: 'completed' },
        }),
        prisma.cqiProject.count({
          where: { departmentId: dept.id, isActive: true, isOutstanding: true },
        }),
      ])
      return {
        department: { id: dept.id, code: dept.code, name: dept.name },
        total,
        completed,
        outstanding,
      }
    })
  )

  return successResponse(data)
}
