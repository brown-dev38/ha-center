import { randomBytes } from 'crypto'

export type MicrosoftConfig = {
  enabled: boolean
  tenantId: string
  clientId: string
  clientSecret: string
  redirectUri: string
  allowedDomains: string[]
  autoProvision: boolean
  defaultRoleName: string
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function getMicrosoftConfig(): MicrosoftConfig | null {
  const tenantId = process.env.AZURE_TENANT_ID?.trim()
  const clientId = process.env.AZURE_CLIENT_ID?.trim()
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim()
  const redirectUri =
    process.env.AZURE_REDIRECT_URI?.trim() ?? `${siteOrigin()}/api/v1/auth/microsoft/callback`

  if (!tenantId || !clientId || !clientSecret) return null

  const domainsRaw = process.env.AZURE_ALLOWED_DOMAINS?.trim() ?? 'up.ac.th'
  const allowedDomains = domainsRaw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  return {
    enabled: true,
    tenantId,
    clientId,
    clientSecret,
    redirectUri,
    allowedDomains,
    autoProvision: process.env.AZURE_AUTO_PROVISION !== 'false',
    defaultRoleName: process.env.AZURE_DEFAULT_ROLE?.trim() || 'document_manager',
  }
}

function authority(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`
}

export function buildMicrosoftAuthorizeUrl(config: MicrosoftConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: 'openid profile email User.Read offline_access',
    state,
    response_mode: 'query',
    prompt: 'select_account',
  })
  return `${authority(config.tenantId)}/authorize?${params.toString()}`
}

export async function exchangeMicrosoftCode(
  config: MicrosoftConfig,
  code: string
): Promise<{ accessToken: string; idToken?: string }> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  })

  const res = await fetch(`${authority(config.tenantId)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const json = (await res.json()) as {
    access_token?: string
    id_token?: string
    error?: string
    error_description?: string
  }

  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description ?? json.error ?? 'Microsoft token exchange failed')
  }

  return { accessToken: json.access_token, idToken: json.id_token }
}

export type MicrosoftProfile = {
  oid: string
  email: string
  firstName: string
  lastName: string
  displayName: string
}

export async function fetchMicrosoftProfile(accessToken: string): Promise<MicrosoftProfile> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const data = (await res.json()) as {
    id?: string
    mail?: string
    userPrincipalName?: string
    displayName?: string
    givenName?: string
    surname?: string
    error?: { message?: string }
  }

  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? 'ไม่สามารถดึงข้อมูลบัญชี Microsoft ได้')
  }

  const email = (data.mail ?? data.userPrincipalName ?? '').trim().toLowerCase()
  if (!email) throw new Error('บัญชี Microsoft ไม่มีอีเมล')

  const firstName = data.givenName?.trim() || data.displayName?.split(' ')[0] || 'ผู้ใช้'
  const lastName =
    data.surname?.trim() ||
    (data.displayName?.includes(' ') ? data.displayName.split(' ').slice(1).join(' ') : '')

  return {
    oid: data.id,
    email,
    firstName,
    lastName: lastName || '-',
    displayName: data.displayName ?? `${firstName} ${lastName}`.trim(),
  }
}

export function isEmailDomainAllowed(email: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return true
  const domain = email.split('@')[1]?.toLowerCase()
  return !!domain && allowedDomains.includes(domain)
}

const memoryStore = new Map<string, { value: string; expiresAt: number }>()

function memorySet(key: string, value: string, ttlSec: number) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 })
}

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  return entry.value
}

function memoryDel(key: string) {
  memoryStore.delete(key)
}

const PREFIX = {
  oauthState: 'auth:ms:state:',
  exchange: 'auth:ms:exchange:',
} as const

export async function storeOAuthState(state: string, ttlSec = 600): Promise<void> {
  memorySet(`${PREFIX.oauthState}${state}`, '1', ttlSec)
}

export async function consumeOAuthState(state: string): Promise<boolean> {
  const key = `${PREFIX.oauthState}${state}`
  const ok = memoryGet(key) !== null
  if (ok) memoryDel(key)
  return ok
}

export function createOAuthState(): string {
  return randomBytes(24).toString('hex')
}

export type MicrosoftExchangePayload = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    department: { id: string; code: string; name: string } | null
  }
}

export async function storeMicrosoftExchange(
  code: string,
  payload: MicrosoftExchangePayload,
  ttlSec = 120
): Promise<void> {
  memorySet(`${PREFIX.exchange}${code}`, JSON.stringify(payload), ttlSec)
}

export async function consumeMicrosoftExchange(
  code: string
): Promise<MicrosoftExchangePayload | null> {
  const key = `${PREFIX.exchange}${code}`
  const raw = memoryGet(key)
  if (!raw) return null
  memoryDel(key)
  return JSON.parse(raw) as MicrosoftExchangePayload
}

export function createExchangeCode(): string {
  return randomBytes(32).toString('hex')
}

export function frontendLoginUrl(error?: string): string {
  const base = `${siteOrigin()}/login`
  if (!error) return base
  return `${base}?error=${encodeURIComponent(error)}`
}

export function frontendCallbackUrl(exchangeCode: string): string {
  return `${siteOrigin()}/auth/callback?code=${encodeURIComponent(exchangeCode)}`
}

export const microsoftErrors: Record<string, string> = {
  MICROSOFT_NOT_CONFIGURED: 'ยังไม่ได้ตั้งค่า Microsoft Login',
  DOMAIN_NOT_ALLOWED: 'อีเมลไม่อยู่ในโดเมนที่อนุญาต',
  USER_NOT_REGISTERED: 'บัญชีนี้ยังไม่ได้ลงทะเบียนในระบบ กรุณาติดต่อผู้ดูแล',
  DEFAULT_ROLE_MISSING: 'ไม่พบบทบาทเริ่มต้นสำหรับผู้ใช้ใหม่',
  INVALID_STATE: 'เซสชันเข้าสู่ระบบหมดอายุ กรุณาลองใหม่',
  EXCHANGE_EXPIRED: 'รหัสแลก token หมดอายุ กรุณาเข้าสู่ระบบใหม่',
}
