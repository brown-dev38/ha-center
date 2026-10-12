export type MeetingParticipantDraft = {
  key: string
  kind: 'user' | 'guest'
  userId?: string
  displayName: string
  departmentName: string
  positionTitle: string | null
}

export type MeetingParticipantApiItem =
  | { userId: string }
  | { displayName: string; departmentName: string; positionTitle?: string }

export function draftToApiPayload(list: MeetingParticipantDraft[]): MeetingParticipantApiItem[] {
  return list.map((p) => {
    if (p.kind === 'user' && p.userId) return { userId: p.userId }
    return {
      displayName: p.displayName,
      departmentName: p.departmentName,
      positionTitle: p.positionTitle ?? undefined,
    }
  })
}

export function groupParticipantsByDepartment(list: MeetingParticipantDraft[]) {
  const map = new Map<string, MeetingParticipantDraft[]>()
  for (const p of list) {
    const dept = p.departmentName.trim() || 'ไม่ระบุแผนก'
    const arr = map.get(dept) ?? []
    arr.push(p)
    map.set(dept, arr)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'th'))
}

export function newParticipantKey() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
