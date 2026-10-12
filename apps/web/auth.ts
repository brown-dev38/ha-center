import type { NextAuthConfig } from 'next-auth'
import { compare } from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { authConfig } from '@/auth.config'
import { getMicrosoftConfig, isEmailDomainAllowed } from '@/app/auth/server/microsoft-auth'
import { resolveMicrosoftUser } from '@/app/auth/server/microsoft-user'
import { isDevLoginEnabled, getMicrosoftEnabled } from '@/app/auth/server/auth-config'
import { prisma } from '@/app/common/server/prisma'

function mapDbUser(user: {
  id: string
  email: string
  firstName: string
  lastName: string
  departmentId: string | null
  role: { name: string; displayName: string }
  department: { id: string; code: string; name: string } | null
}) {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role.name,
    roleLabel: user.role.displayName,
    departmentId: user.departmentId,
    department: user.department
      ? { id: user.department.id, code: user.department.code, name: user.department.name }
      : null,
  }
}



const providers: NextAuthConfig['providers'] = []

const msConfig = getMicrosoftEnabled() ? getMicrosoftConfig() : null
if (msConfig) {
  providers.push(
    MicrosoftEntraID({
      clientId: msConfig.clientId,
      clientSecret: msConfig.clientSecret,
      issuer: `https://login.microsoftonline.com/${msConfig.tenantId}/v2.0`,
    })
  )
}


if (isDevLoginEnabled()) {
  providers.push(
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials?.username?.toString().trim()
        const password = credentials?.password?.toString() ?? ''
        if (!username || password.length < 6) return null

        const user = await prisma.user.findFirst({
          where: {
            isActive: true,
            OR: [{ username }, { email: username }],
          },
          include: {
            role: true,
            department: true,
          },
        })

        if (!user || !(await compare(password, user.passwordHash))) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return mapDbUser(user)
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile, user }) {
      if (account?.provider === 'microsoft-entra-id') {
        const email = (profile?.email ?? profile?.preferred_username)?.toString().trim().toLowerCase()
        const oid = account.providerAccountId
        if (!email || !oid) return false

        const config = getMicrosoftConfig()
        if (!config || !isEmailDomainAllowed(email, config.allowedDomains)) {
          return '/login?error=' + encodeURIComponent('อีเมลไม่อยู่ในโดเมนที่อนุญาต')
        }

        try {
          const dbUser = await resolveMicrosoftUser({
            oid,
            email,
            firstName: profile?.given_name?.toString().trim() || profile?.name?.toString().split(' ')[0] || 'ผู้ใช้',
            lastName:
              profile?.family_name?.toString().trim() ||
              (profile?.name?.toString().includes(' ')
                ? profile.name.toString().split(' ').slice(1).join(' ')
                : '-') ||
              '-',
            displayName: profile?.name?.toString() ?? email,
          })

          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          })

          Object.assign(user, mapDbUser(dbUser))
          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : 'เข้าสู่ระบบด้วย Microsoft ไม่สำเร็จ'
          return '/login?error=' + encodeURIComponent(message)
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roleLabel = user.roleLabel
        token.departmentId = user.departmentId
        token.department = user.department
        token.email = user.email
        token.name = user.name
        return token
      }

      // หลัง migrate users.id (เช่น cuid → USR-0001) ซ่อม JWT เก่าด้วยอีเมล — ไม่บังคับ login ใหม่
      const tokenId = typeof token.id === 'string' ? token.id : ''
      const tokenEmail = typeof token.email === 'string' ? token.email.trim().toLowerCase() : ''
      const idLooksStale = Boolean(tokenId) && !tokenId.startsWith('USR-')

      if (idLooksStale && tokenEmail) {
        const dbUser = await prisma.user.findFirst({
          where: { email: tokenEmail, isActive: true },
          include: {
            role: { select: { name: true, displayName: true } },
            department: { select: { id: true, code: true, name: true } },
          },
        })
        if (dbUser) {
          const mapped = mapDbUser(dbUser)
          token.id = mapped.id
          token.role = mapped.role
          token.roleLabel = mapped.roleLabel
          token.departmentId = mapped.departmentId
          token.department = mapped.department
          token.email = mapped.email
          token.name = mapped.name
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id
        if (typeof token.role === 'string') session.user.role = token.role
        if (typeof token.roleLabel === 'string') session.user.roleLabel = token.roleLabel
        session.user.departmentId = typeof token.departmentId === 'string' ? token.departmentId : null
        session.user.department =
          token.department && typeof token.department === 'object' ? (token.department as typeof session.user.department) : null
        if (typeof token.email === 'string') session.user.email = token.email
        if (typeof token.name === 'string') session.user.name = token.name
      }
      return session
    },
  },
})

