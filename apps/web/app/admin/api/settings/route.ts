import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import { requireRole } from '@/app/auth/server/route-auth'
import {
  getAllSettings,
  saveHaV6DocLayout,
  saveHaV6DocOverrides,
  savePageText,
  saveSiteSettings,
  saveTableColumnSettings,
  saveUILabels,
  type HaV6DocLayout,
  type HaV6DocOverrides,
  type PageTextSettings,
  type SiteSettings,
  type TableColumnSettings,
  type UILabelSettings,
} from '@/app/admin/server/app-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const settings = await getAllSettings()
    return successResponse(settings)
  })
}

export async function PATCH(request: NextRequest) {
  return withRouteHandler(async () => {
    const auth = await requireRole(request, 'admin')
    if ('error' in auth) return auth.error

    const body = (await request.json()) as {
      site?: Partial<SiteSettings>
      pageText?: PageTextSettings
      tableColumns?: TableColumnSettings
      uiLabels?: UILabelSettings
      haV6DocOverrides?: HaV6DocOverrides
      haV6DocLayout?: Partial<HaV6DocLayout>
    }

    if (body.site) await saveSiteSettings(body.site, auth.auth.user.id)
    if (body.pageText) await savePageText(body.pageText, auth.auth.user.id)
    if (body.tableColumns) await saveTableColumnSettings(body.tableColumns, auth.auth.user.id)
    if (body.uiLabels) await saveUILabels(body.uiLabels, auth.auth.user.id)
    if (body.haV6DocOverrides) await saveHaV6DocOverrides(body.haV6DocOverrides, auth.auth.user.id)
    if (body.haV6DocLayout) await saveHaV6DocLayout(body.haV6DocLayout, auth.auth.user.id)

    const settings = await getAllSettings()
    return successResponse(settings, 'บันทึกการตั้งค่าแล้ว')
  })
}
