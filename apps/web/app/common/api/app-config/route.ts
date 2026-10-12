import { successResponse } from '@/app/auth/server/auth-user'
import { withRouteHandler } from '@/app/common/server/api-error'
import {
  getHaV6DocLayout,
  getHaV6DocOverrides,
  getMenuOverride,
  getPageText,
  getSiteSettings,
  getTableColumnSettings,
  getUILabels,
} from '@/app/admin/server/app-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** ค่าระบบสาธารณะ (อ่านอย่างเดียว) — ชื่อระบบ, เมนู, ข้อความหน้า, คอลัมน์ตาราง */
export async function GET() {
  return withRouteHandler(async () => {
    const [site, menu, pageText, tableColumns, uiLabels, haV6DocOverrides, haV6DocLayout] =
      await Promise.all([
        getSiteSettings(),
        getMenuOverride(),
        getPageText(),
        getTableColumnSettings(),
        getUILabels(),
        getHaV6DocOverrides(),
        getHaV6DocLayout(),
      ])
    return successResponse({
      site,
      menu,
      pageText,
      tableColumns,
      uiLabels,
      haV6DocOverrides,
      haV6DocLayout,
    })
  })
}
