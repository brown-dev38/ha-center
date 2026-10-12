import { auth } from '@/auth'
import { prisma } from '@/app/common/server/prisma'
import type { AuthenticatedUser } from '@/app/auth/server/auth-user'

export async function getSessionAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      role: { select: { name: true, displayName: true } },
      department: { select: { id: true, code: true, name: true } },
    },
  })

  if (!dbUser) return null

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role.name,
    roleLabel: dbUser.role.displayName,
    departmentId: dbUser.departmentId,
    departmentName: dbUser.department?.name ?? null,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    avatarUrl: dbUser.avatarUrl ?? null,
  }
}
