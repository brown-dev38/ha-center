export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  department: { id: string; code: string; name: string } | null
}
