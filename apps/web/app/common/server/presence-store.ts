export type PresenceEntry = {
  userId: string
  name: string
  email: string | null
  role: string | null
  roleLabel: string | null
  departmentName: string | null
  avatarUrl: string | null
  ipAddress: string | null
  userAgent: string | null
  page: string | null
  lastSeenAt: number
  loginAt: number
}

export const ONLINE_WINDOW_MS = 90_000
const PURGE_AFTER_MS = 15 * 60_000

const store = new Map<string, PresenceEntry>()

export function touchPresence(
  input: Omit<PresenceEntry, 'lastSeenAt' | 'loginAt'> & { loginAt?: number }
): PresenceEntry {
  const now = Date.now()
  const existing = store.get(input.userId)
  const entry: PresenceEntry = {
    ...input,
    loginAt: existing?.loginAt ?? input.loginAt ?? now,
    lastSeenAt: now,
  }
  store.set(input.userId, entry)
  return entry
}

export function removePresence(userId: string): void {
  store.delete(userId)
}

function purgeStale(): void {
  const now = Date.now()
  for (const [id, entry] of store) {
    if (now - entry.lastSeenAt > PURGE_AFTER_MS) store.delete(id)
  }
}

export function getOnlineUsers(): PresenceEntry[] {
  purgeStale()
  const now = Date.now()
  return [...store.values()]
    .filter((e) => now - e.lastSeenAt <= ONLINE_WINDOW_MS)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
}

export function getOnlineCount(): number {
  return getOnlineUsers().length
}
