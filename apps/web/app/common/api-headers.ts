export function apiHeaders(json = false): Headers {
  const headers = new Headers()
  if (json) headers.set('Content-Type', 'application/json')
  return headers
}
