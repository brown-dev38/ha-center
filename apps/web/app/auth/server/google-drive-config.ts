export const GDRIVE_PREFIX = 'gdrive:'

type ServiceAccountCredentials = {
  client_email: string
  private_key: string
}

export function parseServiceAccount(): ServiceAccountCredentials | null {
  const jsonRaw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim()
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as ServiceAccountCredentials
      if (parsed.client_email && parsed.private_key) return parsed
    } catch {
      return null
    }
  }

  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim()
  const key = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.trim()
  if (email && key) {
    return { client_email: email, private_key: key.replace(/\\n/g, '\n') }
  }

  return null
}

/** เปิดใช้เมื่อตั้งโฟลเดอร์ + Service Account (ไม่ต้อง Google Workspace) */
export function isGoogleDriveConfigured(): boolean {
  return Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() && parseServiceAccount())
}

export function isGoogleDriveRef(filePath: string | null | undefined): boolean {
  return Boolean(filePath?.startsWith(GDRIVE_PREFIX))
}

export function toGoogleDriveRef(fileId: string): string {
  return `${GDRIVE_PREFIX}${fileId}`
}

export function googleDriveFileId(filePath: string): string {
  return filePath.slice(GDRIVE_PREFIX.length)
}
