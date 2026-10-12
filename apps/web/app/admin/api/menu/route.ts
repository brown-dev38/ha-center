import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { requireRole } from '@/app/auth/server/route-auth'
import { getMenuCatalog } from '@/app/common/navigation'
import { getMenuOverride, saveMenuOverride, type MenuOverride } from '@/app/admin/server/app-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const [catalog, override] = await Promise.all([
      Promise.resolve(getMenuCatalog()),
      getMenuOverride(),
    ])
    return successResponse({ catalog, override })
  })
}

export async function PATCH(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const body = (await request.json()) as Partial<MenuOverride>
    await saveMenuOverride(body, auth.auth.user.id)

    const override = await getMenuOverride()
    return successResponse(override, 'บันทึกเมนูแล้ว')
  })
}
