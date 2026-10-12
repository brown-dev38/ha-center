import { Readable } from 'node:stream'
import {
  googleDriveFileId,
  isGoogleDriveConfigured,
  isGoogleDriveRef,
  parseServiceAccount,
  toGoogleDriveRef,
} from './google-drive-config'

export {
  GDRIVE_PREFIX,
  googleDriveFileId,
  isGoogleDriveConfigured,
  isGoogleDriveRef,
  toGoogleDriveRef,
} from './google-drive-config'

type DriveClient = {
  files: {
    list: (args: Record<string, unknown>) => Promise<{ data: { files?: Array<{ id?: string | null }> } }>
    create: (args: Record<string, unknown>) => Promise<{ data: { id?: string | null } }>
    get: (
      args: Record<string, unknown>,
      opts?: { responseType?: string }
    ) => Promise<{ data: ArrayBuffer | unknown }>
    delete: (args: Record<string, unknown>) => Promise<unknown>
  }
}

let driveClient: DriveClient | null = null

async function getDrive(): Promise<DriveClient> {
  if (driveClient) return driveClient

  const creds = parseServiceAccount()
  if (!creds) {
    throw new Error('GOOGLE_DRIVE_NOT_CONFIGURED')
  }

  const { google } = await import('googleapis')
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  driveClient = google.drive({ version: 'v3', auth }) as DriveClient
  return driveClient
}

function getRootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim()
  if (!id) throw new Error('GOOGLE_DRIVE_FOLDER_ID_MISSING')
  return id
}

/** สร้าง/ค้นหา subfolder ภายใต้ root (เช่น ha-center/documents/abc) */
async function ensureFolderPath(relativePath: string): Promise<string> {
  const drive = await getDrive()
  const rootId = getRootFolderId()
  const parts = relativePath.split('/').filter(Boolean)
  let parentId = rootId

  for (const name of parts) {
    const q = [
      `'${parentId}' in parents`,
      `name = '${name.replace(/'/g, "\\'")}'`,
      'mimeType = \'application/vnd.google-apps.folder\'',
      'trashed = false',
    ].join(' and ')

    const existing = await drive.files.list({
      q,
      fields: 'files(id)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    const found = existing.data.files?.[0]?.id
    if (found) {
      parentId = found
      continue
    }

    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
      supportsAllDrives: true,
    })

    if (!created.data.id) throw new Error('GOOGLE_DRIVE_FOLDER_CREATE_FAILED')
    parentId = created.data.id
  }

  return parentId
}

export async function uploadGoogleDriveFile(params: {
  subfolder: string
  fileName: string
  mimeType: string
  buffer: Buffer
}): Promise<string> {
  const drive = await getDrive()
  const parentId = await ensureFolderPath(params.subfolder)

  const created = await drive.files.create({
    requestBody: {
      name: params.fileName,
      parents: [parentId],
    },
    media: {
      mimeType: params.mimeType,
      body: Readable.from(params.buffer),
    },
    fields: 'id',
    supportsAllDrives: true,
  })

  if (!created.data.id) throw new Error('GOOGLE_DRIVE_UPLOAD_FAILED')
  return created.data.id
}

export async function downloadGoogleDriveFile(fileId: string): Promise<Buffer> {
  const drive = await getDrive()
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  )
  return Buffer.from(res.data as ArrayBuffer)
}

export async function deleteGoogleDriveFile(fileId: string): Promise<void> {
  const drive = await getDrive()
  await drive.files.delete({ fileId, supportsAllDrives: true })
}

/** ทดสอบการเชื่อมต่อ — อ่าน metadata โฟลเดอร์ root */
export async function pingGoogleDrive(): Promise<{ ok: boolean; folderName?: string; error?: string }> {
  if (!isGoogleDriveConfigured()) {
    return { ok: false, error: 'GOOGLE_DRIVE_NOT_CONFIGURED' }
  }

  try {
    const drive = await getDrive()
    const folderId = getRootFolderId()
    const meta = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,mimeType',
      supportsAllDrives: true,
    })
    if ((meta.data as { mimeType?: string }).mimeType !== 'application/vnd.google-apps.folder') {
      return { ok: false, error: 'GOOGLE_DRIVE_FOLDER_ID ไม่ใช่โฟลเดอร์' }
    }
    return { ok: true, folderName: (meta.data as { name?: string }).name ?? undefined }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: message.slice(0, 120) }
  }
}
