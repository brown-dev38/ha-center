export function getMicrosoftEnabled(): boolean {
  if (process.env.MICROSOFT_LOGIN_ENABLED === 'false') return false
  const tenantId = process.env.AZURE_TENANT_ID?.trim()
  const clientId = process.env.AZURE_CLIENT_ID?.trim()
  const clientSecret = process.env.AZURE_CLIENT_SECRET?.trim()
  return Boolean(tenantId && clientId && clientSecret)
}

export function isDevLoginEnabled(): boolean {
  if (process.env.DEV_LOGIN_ENABLED === 'true') return true
  if (process.env.DEV_LOGIN_ENABLED === 'false') return false
  return !getMicrosoftEnabled()
}

