import { NextResponse } from 'next/server'
import {
  documentLinkFromStorage,
  isDocumentLinkStorage,
  normalizeDocumentLink,
} from '@/app/common/document-link'

/** ถ้า path เป็น `url:https://...` ให้ redirect ไปต้นทาง */
export function redirectIfExternalLink(filePath: string | null | undefined): NextResponse | null {
  if (!filePath || !isDocumentLinkStorage(filePath)) return null

  const external = documentLinkFromStorage(filePath)
  const parsed = normalizeDocumentLink(external)
  const target = parsed.ok ? parsed.url : external
  return NextResponse.redirect(target, 302)
}
