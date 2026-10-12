import { NextResponse } from 'next/server'
import { getMicrosoftEnabled, isDevLoginEnabled } from '@/app/auth/server/auth-config'
import { pingGoogleDrive } from '@/app/auth/server/google-drive'
import {
  getStorageProfile,
  isDemoDeployment,
  useGoogleDriveForFiles,
} from '@/app/common/server/deployment'
import { prisma } from '@/app/common/server/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DB_CHECK_TTL_MS = process.env.NODE_ENV === 'development' ? 120_000 : 30_000
let cachedDbCheck: { at: number; ok: boolean; error?: string } | null = null

async function checkDatabase(): Promise<{ ok: boolean; error?: string }> {
  const now = Date.now()
  if (cachedDbCheck && now - cachedDbCheck.at < DB_CHECK_TTL_MS) {
    return { ok: cachedDbCheck.ok, error: cachedDbCheck.error }
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    cachedDbCheck = { at: now, ok: true }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ'
    cachedDbCheck = { at: now, ok: false, error: message }
    return { ok: false, error: message }
  }
}

function getAuthDiagnostics() {
  const hasSecret = Boolean(process.env.AUTH_SECRET?.trim())
  const microsoftEnabled = getMicrosoftEnabled()
  const devLoginEnabled = isDevLoginEnabled()
  const providerCount = (microsoftEnabled ? 1 : 0) + (devLoginEnabled ? 1 : 0)

  let code: string | undefined
  if (!hasSecret) code = 'AUTH_SECRET_MISSING'
  else if (providerCount === 0) code = 'AUTH_NO_PROVIDERS'

  return {
    ready: hasSecret && providerCount > 0,
    hasSecret,
    authUrl: process.env.AUTH_URL?.trim() ?? null,
    microsoftEnabled,
    devLoginEnabled,
    providerCount,
    ...(code ? { code } : {}),
  }
}

/** ตรวจ deploy / DB / โหมด demo vs on-prem */
export async function GET() {
  const storage = getStorageProfile()
  const googleDriveEnabled = useGoogleDriveForFiles()
  const base = {
    mode: 'web-native' as const,
    deployment: storage.deployment,
    storage: {
      documents: storage.documents,
      km: storage.km,
      meetings: storage.meetings,
      elearning: storage.elearning,
      googleDrive: googleDriveEnabled,
    },
    demoMode: isDemoDeployment(),
  }

  const warnings: string[] = []
  const authStatus = getAuthDiagnostics()
  if (!authStatus.ready) {
    warnings.push(
      authStatus.code === 'AUTH_SECRET_MISSING'
        ? 'ยังไม่ได้ตั้ง AUTH_SECRET ใน .env.local'
        : 'ยังไม่มี login provider — ตรวจ AZURE_* หรือ DEV_LOGIN_ENABLED=true'
    )
  }

  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    const demoHint = isDemoDeployment()
      ? 'บน Vercel (Demo): ตั้ง DATABASE_URL เป็น MySQL บนคลาวด์'
      : 'บนเซิร์ฟเวอร์ รพ.: ตั้ง DATABASE_URL เป็น MySQL ภายใน'
    return NextResponse.json(
      {
        ...base,
        ok: false,
        database: false,
        auth: authStatus,
        code: 'DATABASE_URL_MISSING',
        error: `ยังไม่ได้ตั้งค่า DATABASE_URL — ${demoHint}`,
        ...(warnings.length > 0 ? { warnings } : {}),
      },
      { status: 503 }
    )
  }

  const db = await checkDatabase()
  if (db.ok) {
    let googleDrive: { ok: boolean; folderName?: string; error?: string } | undefined
    if (googleDriveEnabled) {
      googleDrive = await pingGoogleDrive()
      if (!googleDrive.ok) {
        warnings.push(
          `Google Drive: ${googleDrive.error ?? 'เชื่อมต่อไม่ได้'} — ตรวจ docs/GOOGLE-DRIVE.md`
        )
      }
    }

    const storageHint =
      storage.documents === 'link'
        ? 'เอกสารแนบลิงก์ Google Drive — KM/ประชุม/e-learning ตาม storage profile'
        : googleDriveEnabled
          ? 'ไฟล์ทั้งระบบเก็บใน Google Drive (Gmail ส่วนตัว + Service Account)'
          : storage.deployment === 'demo'
            ? 'Demo — เอกสาร/KM ใน MySQL, ประชุม/e-learning ตาม storage profile'
            : 'Production ภายใน — ไฟล์ประชุม/e-learning บนดิสก์เซิร์ฟ'

    return NextResponse.json({
      ...base,
      ok: true,
      legacyProxy: false,
      database: true,
      auth: authStatus,
      ...(googleDrive ? { googleDrive } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
      message: storageHint,
    })
  }

  const message = db.error ?? 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ'
  return NextResponse.json(
    {
      ...base,
      ok: false,
      database: false,
      code: 'DATABASE_UNAVAILABLE',
      error: `ไม่สามารถเชื่อมต่อ MySQL ได้ — ตรวจสอบ DATABASE_URL (${message.slice(0, 80)})`,
    },
    { status: 503 }
  )
}
