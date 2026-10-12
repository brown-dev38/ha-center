import { access, mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveUploadRoot } from '@/app/common/server/deployment'

const AVATAR_ROOT = resolveUploadRoot('AVATAR_UPLOAD_DIR', 'avatars')
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export function avatarPublicPath(userId: string) {
  return `/api/v1/auth/avatar/${userId}`
}

function extensionFromMime(mimeType: string) {
  return MIME_TO_EXT[mimeType.toLowerCase()] ?? null
}

function mimeFromExtension(ext: string) {
  return EXT_TO_MIME[ext.toLowerCase()] ?? 'application/octet-stream'
}

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export function validateAvatarFile(file: File) {
  const mime = file.type.toLowerCase()
  if (!extensionFromMime(mime)) {
    return { ok: false as const, error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP หรือ GIF', code: 'INVALID_FILE_TYPE' }
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false as const, error: 'รูปภาพใหญ่เกิน 2MB', code: 'FILE_TOO_LARGE' }
  }
  return { ok: true as const }
}

export async function deleteUserAvatarFiles(userId: string) {
  let entries: string[] = []
  try {
    entries = await readdir(AVATAR_ROOT)
  } catch {
    return
  }

  const prefix = `${userId}.`
  await Promise.all(
    entries
      .filter((name) => name.startsWith(prefix))
      .map((name) => unlink(path.join(AVATAR_ROOT, name)).catch(() => undefined))
  )
}

export async function saveUserAvatar(userId: string, file: File) {
  const validation = validateAvatarFile(file)
  if (!validation.ok) return validation

  const ext = extensionFromMime(file.type)!
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(AVATAR_ROOT, { recursive: true })
  await deleteUserAvatarFiles(userId)
  await writeFile(path.join(AVATAR_ROOT, `${userId}.${ext}`), buffer)

  return {
    ok: true as const,
    avatarUrl: avatarPublicPath(userId),
    mimeType: file.type,
  }
}

export async function getUserAvatarFile(userId: string) {
  for (const [ext, mimeType] of Object.entries(EXT_TO_MIME)) {
    const filePath = path.join(AVATAR_ROOT, `${userId}.${ext}`)
    if (await fileExists(filePath)) {
      return { filePath, mimeType }
    }
  }
  return null
}
