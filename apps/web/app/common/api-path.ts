/**
 * แปลง URL แบบเดิม (/api/v1/*) ไปยัง Route Handler ที่อยู่ใต้ app/<feature>/api/
 * ไม่พึ่ง next.config rewrites — เรียกตรง path จริงบน Next.js
 */
export function resolveAppApiUrl(input: string): string {
  if (!input.includes('/api/')) return input

  let url: URL
  try {
    url = input.startsWith('http') ? new URL(input) : new URL(input, 'http://local')
  } catch {
    return input
  }

  const { pathname, search } = url
  let resolved = pathname

  if (pathname === '/api/health') {
    resolved = '/common/health'
  } else if (pathname.startsWith('/api/v1/')) {
    const rest = pathname.slice('/api/v1/'.length)
    const slash = rest.indexOf('/')
    const feature = slash === -1 ? rest : rest.slice(0, slash)
    const sub = slash === -1 ? '' : rest.slice(slash + 1)

    if (feature === 'presence') {
      resolved = `/common/api/presence${sub ? `/${sub}` : ''}`
    } else if (feature) {
      resolved = `/${feature}/api${sub ? `/${sub}` : ''}`
    }
  }

  // //


  // //

  if (resolved === pathname) return input

  if (input.startsWith('http')) {
    url.pathname = resolved
    return url.toString()
  }
  return `${resolved}${search}`
}

/** สำหรับ path สั้นใน fetchApiData เช่น `documents/categories` */
export function featureApiPath(relativePath: string): string {
  const qIndex = relativePath.indexOf('?')
  const pathOnly = qIndex === -1 ? relativePath : relativePath.slice(0, qIndex)
  const query = qIndex === -1 ? '' : relativePath.slice(qIndex)
  const trimmed = pathOnly.replace(/^\//, '')
  if (!trimmed) return relativePath

  const slash = trimmed.indexOf('/')
  const feature = slash === -1 ? trimmed : trimmed.slice(0, slash)
  const sub = slash === -1 ? '' : trimmed.slice(slash + 1)

  if (feature === 'presence') {
    return `/common/api/presence${sub ? `/${sub}` : ''}${query}`
  }
  return `/${feature}/api${sub ? `/${sub}` : ''}${query}`
}
