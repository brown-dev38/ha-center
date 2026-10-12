import {
  complaintFingerprint,
  nextCaseNo,
  type ComplaintCase,
} from '@/app/complaints/complaint-model'

const STORAGE_KEY = 'ha-complaint-cases-v1'

export function loadComplaintCases(): ComplaintCase[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ComplaintCase[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveComplaintCases(cases: ComplaintCase[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
}

export function importComplaintCases(
  incoming: Array<Omit<ComplaintCase, 'id' | 'caseNo' | 'fingerprint' | 'sourceFile'> & { fingerprint?: string }>,
  sourceFile: string
): { cases: ComplaintCase[]; added: number; skipped: number } {
  const current = loadComplaintCases()
  const seen = new Set(current.map((item) => item.fingerprint))
  const next = [...current]
  let added = 0
  let skipped = 0

  for (const row of incoming) {
    const fingerprint = row.fingerprint || complaintFingerprint(row.submittedAt, row.detail)
    if (!row.detail.trim() || seen.has(fingerprint)) {
      skipped += 1
      continue
    }
    seen.add(fingerprint)
    const created: ComplaintCase = {
      ...row,
      id: `voc-${Date.now().toString(36)}-${added}`,
      caseNo: nextCaseNo(next, row.submittedAt || row.incidentDate),
      fingerprint,
      sourceFile,
    }
    next.push(created)
    added += 1
  }

  next.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
  saveComplaintCases(next)
  return { cases: next, added, skipped }
}

export function updateComplaintCase(id: string, patch: Partial<ComplaintCase>): ComplaintCase[] {
  const next = loadComplaintCases().map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item))
  saveComplaintCases(next)
  return next
}
