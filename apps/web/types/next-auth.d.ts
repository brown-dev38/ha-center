import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      roleLabel: string
      departmentId: string | null
      department: { id: string; code: string; name: string } | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    roleLabel: string
    departmentId: string | null
    department: { id: string; code: string; name: string } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    roleLabel: string
    departmentId: string | null
    department: { id: string; code: string; name: string } | null
  }
}
