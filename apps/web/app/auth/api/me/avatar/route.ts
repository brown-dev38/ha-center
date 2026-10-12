import { NextRequest } from 'next/server'
import { prisma } from '@/app/common/server/prisma'
import { errorResponse, mapMeProfile, requireAuthUser, successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  avatarPublicPath,
  deleteUserAvatarFiles,
  saveUserAvatar,
} from '@/app/profile/server/avatar-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return errorResponse(400, 'ข้อมูลไม่ถูกต้อง', 'VALIDATION_ERROR')
    }

    const file = form.get('avatar')
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse(422, 'กรุณาเลือกรูปภาพ', 'VALIDATION_ERROR')
    }

    const saved = await saveUserAvatar(auth.user.id, file)
    if (!saved.ok) {
      return errorResponse(422, saved.error, saved.code)
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { avatarUrl: avatarPublicPath(auth.user.id) },
      include: { role: true, department: true },
    })

    return successResponse(mapMeProfile(updated), 'อัปเดตรูปโปรไฟล์แล้ว')
  })
}

export async function DELETE(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireAuthUser(request)
    if (!auth) return errorResponse(401, 'กรุณาเข้าสู่ระบบ', 'AUTH_UNAUTHORIZED')

    await deleteUserAvatarFiles(auth.user.id)

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: { avatarUrl: null },
      include: { role: true, department: true },
    })

    return successResponse(mapMeProfile(updated), 'ลบรูปโปรไฟล์แล้ว')
  })
}
