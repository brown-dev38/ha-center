import { hash } from 'bcryptjs'
import { prisma } from '@/app/common/server/prisma'
import {
  getMicrosoftConfig,
  isEmailDomainAllowed,
  type MicrosoftProfile,
} from '@/app/auth/server/microsoft-auth'
import { ensureDocumentManagerRole } from '@/app/auth/server/ensure-document-manager-role'
import { allocateUserId } from '@/app/auth/server/user-id'

const userInclude = { role: true, department: true } as const

export async function resolveMicrosoftUser(profile: MicrosoftProfile) {
  const config = getMicrosoftConfig()
  if (!config) throw new Error('MICROSOFT_NOT_CONFIGURED')

  if (!isEmailDomainAllowed(profile.email, config.allowedDomains)) {
    throw new Error('DOMAIN_NOT_ALLOWED')
  }

  const include = userInclude

  let user =
    (await prisma.user.findFirst({
      where: { microsoftOid: profile.oid, isActive: true },
      include,
    })) ??
    (await prisma.user.findFirst({
      where: { email: profile.email, isActive: true },
      include,
    }))

  if (user) {
    if (!user.microsoftOid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { microsoftOid: profile.oid },
        include,
      })
    }
    return ensureDocumentManagerRole(user, include)
  }

  if (!config.autoProvision) throw new Error('USER_NOT_REGISTERED')

  const role = await prisma.role.findUnique({ where: { name: config.defaultRoleName } })
  if (!role) throw new Error('DEFAULT_ROLE_MISSING')

  const passwordHash = await hash(`ms:${profile.oid}:${Date.now()}`, 10)

  const created = await prisma.$transaction(async (tx) => {
    const id = await allocateUserId(tx)
    return tx.user.create({
      data: {
        id,
        email: profile.email,
        microsoftOid: profile.oid,
        firstName: profile.firstName,
        lastName: profile.lastName,
        passwordHash,
        roleId: role.id,
        username: profile.email.split('@')[0],
      },
      include,
    })
  })

  return ensureDocumentManagerRole(created, include)
}

export function formatMicrosoftUserProfile(user: {
  id: string
  email: string
  firstName: string
  lastName: string
  role: { name: string }
  department: { id: string; code: string; name: string } | null
}) {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role.name,
    department: user.department
      ? { id: user.department.id, code: user.department.code, name: user.department.name }
      : null,
  }
}
