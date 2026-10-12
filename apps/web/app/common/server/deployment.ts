import path from 'node:path'
import { isFileLinkMode } from '@/app/auth/server/file-link-mode'
import { isGoogleDriveConfigured } from '@/app/auth/server/google-drive-config'

export type DeploymentTarget = 'demo' | 'onprem'

export type FileStorageBackend = 'mysql' | 'disk' | 'blob' | 'drive' | 'link'

/** demo = Vercel/public trial · onprem = hospital internal server */
export function getDeploymentTarget(): DeploymentTarget {
  const explicit = process.env.DEPLOYMENT_TARGET?.trim().toLowerCase()
  if (explicit === 'demo' || explicit === 'onprem') return explicit
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return 'demo'
  if (process.env.VERCEL === '1') return 'demo'
  return 'onprem'
}

export function isDemoDeployment(): boolean {
  return getDeploymentTarget() === 'demo'
}

/** เปิด Google Drive เมื่อตั้ง FILE_STORAGE_BACKEND=drive และ credentials ครบ */
export function useGoogleDriveForFiles(): boolean {
  const backend = process.env.FILE_STORAGE_BACKEND?.trim().toLowerCase()
  if (backend === 'drive') return isGoogleDriveConfigured()
  if (backend === 'mysql' || backend === 'disk' || backend === 'blob') return false
  return isGoogleDriveConfigured()
}

export function resolveUploadRoot(envKey: string, defaultSubdir: string): string {
  const fromEnv = process.env[envKey]?.trim()
  if (fromEnv) return path.resolve(fromEnv)
  return path.resolve(process.cwd(), 'uploads', defaultSubdir)
}

export function getMeetingFileBackend(): FileStorageBackend {
  if (isFileLinkMode('meetings')) return 'link'
  if (useGoogleDriveForFiles()) return 'drive'
  if (getDeploymentTarget() === 'onprem') return 'disk'
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return 'blob'
  return 'disk'
}

export function getDocumentFileBackend(): FileStorageBackend {
  if (isFileLinkMode('documents')) return 'link'
  if (useGoogleDriveForFiles()) return 'drive'
  return 'mysql'
}

export function getKmFileBackend(): FileStorageBackend {
  if (isFileLinkMode('km')) return 'link'
  if (useGoogleDriveForFiles()) return 'drive'
  return 'mysql'
}

export function getElearningFileBackend(): FileStorageBackend {
  if (isFileLinkMode('elearning')) return 'link'
  if (useGoogleDriveForFiles()) return 'drive'
  return 'disk'
}

export function getStorageProfile() {
  const documents = getDocumentFileBackend()
  const km = getKmFileBackend()
  const meetings = getMeetingFileBackend()
  const elearning = getElearningFileBackend()

  return {
    deployment: getDeploymentTarget(),
    documents: documents,
    km: km,
    meetings: getMeetingFileBackend(),
    elearning: getElearningFileBackend(),
    paths: {
      documents: resolveUploadRoot('DOCUMENT_UPLOAD_DIR', 'documents'),
      meetings: resolveUploadRoot('MEETING_UPLOAD_DIR', 'meetings'),
      elearning: resolveUploadRoot('ELEARNING_UPLOAD_DIR', 'elearning'),
      worksheets: resolveUploadRoot('WORKSHEET_UPLOAD_DIR', 'worksheets'),
      avatars: resolveUploadRoot('AVATAR_UPLOAD_DIR', 'avatars'),
    },
  }
}
