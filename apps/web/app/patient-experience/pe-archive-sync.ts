import { apiFetch } from '@/app/common/api-fetch'
import { featureApiPath } from '@/app/common/api-path'
import { readApiJson } from '@/app/common/parse-api-response'
import {
  mergePeArchives,
  normalizePeYearArchive,
  type PeYearArchive,
  type PeYearBundle,
} from '@/app/patient-experience/pe-year-archive'

export type PeArchiveSnapshot = {
  revision: number
  archive: PeYearArchive
}

const ARCHIVE_PATH = featureApiPath('patient-experience/archive')
const MIGRATED_KEY = 'ha-pe-archive-server-sync-v1'

type PutResult = PeArchiveSnapshot & { conflict: boolean }

export function hasMigratedLocalPeArchive(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(MIGRATED_KEY) === '1'
}

export function markPeArchiveMigrated() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MIGRATED_KEY, '1')
}

export async function fetchPeArchive(): Promise<PeArchiveSnapshot> {
  const res = await apiFetch(ARCHIVE_PATH)
  const json = await readApiJson<{ success: true; data: PeArchiveSnapshot }>(res)
  return {
    revision: Number(json.data?.revision) || 0,
    archive: normalizePeYearArchive(json.data?.archive),
  }
}

async function putPeArchive(archive: PeYearArchive, expectedRevision: number): Promise<PutResult> {
  const res = await apiFetch(ARCHIVE_PATH, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archive, expectedRevision }),
  })
  const json = (await res.json()) as {
    success?: boolean
    error?: string
    data?: PeArchiveSnapshot
  }
  if (res.status === 409 && json.data) {
    return {
      conflict: true,
      revision: Number(json.data.revision) || 0,
      archive: normalizePeYearArchive(json.data.archive),
    }
  }
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || 'บันทึกคลัง PEP ไม่สำเร็จ')
  }
  return {
    conflict: false,
    revision: Number(json.data.revision) || 0,
    archive: normalizePeYearArchive(json.data.archive),
  }
}

/** Write one slot on top of the shared archive, retrying if another machine saved first. */
export async function publishPeSlot(
  snapshot: PeArchiveSnapshot,
  bundle: PeYearBundle
): Promise<PeArchiveSnapshot> {
  const slotId = bundle.slotId
  if (!slotId) throw new Error('ไม่พบรหัสชุดข้อมูล')
  let current = snapshot
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const next = { ...current.archive, [slotId]: bundle }
    const result = await putPeArchive(next, current.revision)
    if (!result.conflict) return result
    current = result
  }
  throw new Error('มีเครื่องอื่นกำลังบันทึกพร้อมกัน ลองอีกครั้ง')
}

export async function removePublishedSlot(
  snapshot: PeArchiveSnapshot,
  slotId: string
): Promise<PeArchiveSnapshot> {
  let current = snapshot
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const next = { ...current.archive }
    delete next[slotId]
    const result = await putPeArchive(next, current.revision)
    if (!result.conflict) return result
    current = result
  }
  throw new Error('มีเครื่องอื่นกำลังบันทึกพร้อมกัน ลองอีกครั้ง')
}

export async function clearPublishedArchive(snapshot: PeArchiveSnapshot): Promise<PeArchiveSnapshot> {
  let current = snapshot
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await putPeArchive({}, current.revision)
    if (!result.conflict) return result
    current = result
  }
  throw new Error('มีเครื่องอื่นกำลังบันทึกพร้อมกัน ลองอีกครั้ง')
}

/** First visit on this browser: upload local-only slots so older uploads are not stranded. */
export async function migrateLocalPeArchive(
  local: PeYearArchive,
  remote: PeArchiveSnapshot
): Promise<PeArchiveSnapshot> {
  if (hasMigratedLocalPeArchive()) return remote
  const { archive, localNewer } = mergePeArchives(local, remote.archive)
  if (localNewer.length === 0) {
    markPeArchiveMigrated()
    return remote
  }
  let current = remote
  const result = await putPeArchive(archive, current.revision)
  if (!result.conflict) {
    markPeArchiveMigrated()
    return result
  }
  const retryMerge = mergePeArchives(local, result.archive)
  const retried = await putPeArchive(retryMerge.archive, result.revision)
  if (retried.conflict) return result
  markPeArchiveMigrated()
  return retried
}
