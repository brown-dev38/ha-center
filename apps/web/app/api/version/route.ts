import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** ตรวจว่าเบราว์เซอร์ต่อกับ server โค้ดใหม่ (ไม่ใช่ legacy proxy) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    api: 'web-native',
    build: '2026-05-29',
    documents: 'link-or-upload',
  })
}
