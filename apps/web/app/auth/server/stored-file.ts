import { readFile } from 'node:fs/promises'
import {
  googleDriveFileId,
  isGoogleDriveConfigured,
  isGoogleDriveRef,
  toGoogleDriveRef,
} from './google-drive-config'
import { useGoogleDriveForFiles } from '@/app/common/server/deployment'

export {
  GDRIVE_PREFIX,
  googleDriveFileId,
  isGoogleDriveRef,
  toGoogleDriveRef,
} from './google-drive-config'

/** อ่านไฟล์จาก Google Drive / URL / ดิสก์ / BLOB ใน DB */
export async function readStoredBinary(params: {
  filePath: string | null | undefined
  fileData?: Buffer | Uint8Array | null
  inlineMarkers?: string[]
}): Promise<Buffer> {
  if (params.fileData && params.fileData.length > 0) {
    return Buffer.from(params.fileData)
  }

  const filePath = params.filePath?.trim()
  if (!filePath) throw new Error('FILE_NOT_FOUND')

  if (isGoogleDriveRef(filePath)) {
    const { downloadGoogleDriveFile } = await import('./google-drive')
    return downloadGoogleDriveFile(googleDriveFileId(filePath))
  }

  if (params.inlineMarkers?.includes(filePath)) {
    throw new Error('FILE_NOT_FOUND')
  }

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    const response = await fetch(filePath)
    if (!response.ok) throw new Error('FILE_NOT_FOUND')
    return Buffer.from(await response.arrayBuffer())
  }

  return readFile(filePath)
}

export async function saveToConfiguredStorage(params: {
  subfolder: string
  fileName: string
  mimeType: string
  buffer: Buffer
}): Promise<{ filePath: string; fileData: Buffer | null }> {
  if (!useGoogleDriveForFiles()) {
    throw new Error('GOOGLE_DRIVE_NOT_ENABLED')
  }

  const { uploadGoogleDriveFile } = await import('./google-drive')
  const fileId = await uploadGoogleDriveFile({
    subfolder: params.subfolder,
    fileName: params.fileName,
    mimeType: params.mimeType,
    buffer: params.buffer,
  })

  return {
    filePath: toGoogleDriveRef(fileId),
    fileData: null,
  }
}

export function isDriveStorageActive(): boolean {
  return useGoogleDriveForFiles() && isGoogleDriveConfigured()
}
