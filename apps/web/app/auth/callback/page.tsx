import { redirect } from 'next/navigation'

/** Legacy Microsoft callback — NextAuth ใช้ /api/auth/callback/microsoft-entra-id แทนแล้ว */
export default function LegacyAuthCallbackPage() {
  redirect('/login')
}
