/**
 * API base URL for browser / Eden client.
 * - Browser: same-origin (window.location.origin)
 * - Server: NEXT_PUBLIC_SITE_URL หรือ VERCEL_URL สำหรับ SSR
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (site) return site.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
