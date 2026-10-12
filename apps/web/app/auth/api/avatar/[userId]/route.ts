import { readFile } from 'node:fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/app/auth/server/auth-user'
import { getUserAvatarFile } from '@/app/profile/server/avatar-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ userId: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await requireAuthUser(request)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
  }

  const { userId } = await ctx.params
  const avatar = await getUserAvatarFile(userId)
  if (!avatar) {
    return new NextResponse(null, { status: 404 })
  }

  const buffer = await readFile(avatar.filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': avatar.mimeType,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
