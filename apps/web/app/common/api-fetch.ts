import { apiResponseBodyError, normalizeJsonParseError, readApiJson } from '@/app/common/parse-api-response'
import { resolveAppApiUrl } from '@/app/common/api-path'

function resolveFetchInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === 'string') return resolveAppApiUrl(input)
  if (input instanceof URL) return new URL(resolveAppApiUrl(input.toString()))
  if (input instanceof Request) {
    const resolved = resolveAppApiUrl(input.url)
    if (resolved === input.url) return input
    return new Request(resolved, input)
  }
  return input
}

export const apiFetch: typeof fetch = async (input, init) => {
  const resolvedInput = resolveFetchInput(input)

  try {
    const response = await fetch(resolvedInput, {
      ...init,
      credentials: init?.credentials ?? 'same-origin',
    })

    // Soft redirect ครั้งเดียว — กัน hard reload วนจนหน้าจอพริบ
    if (response.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/auth')) {
        const key = 'ha:auth-redirecting'
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1')
          window.location.replace('/login')
        }
      }
    } else if (typeof window !== 'undefined' && response.ok) {
      sessionStorage.removeItem('ha:auth-redirecting')
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        const preview = (await response.clone().text()).trim()
        throw apiResponseBodyError(response.status, preview)
      }
      await readApiJson(response.clone())
      throw apiResponseBodyError(response.status)
    }

    return response
  } catch (err) {
    throw normalizeJsonParseError(err)
  }
}
