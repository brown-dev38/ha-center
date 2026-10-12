import { NextResponse } from 'next/server'
import { buildHscsExecutiveDashboard } from '@/app/hscs/server/hscs-analytics'
import {
  parseHscsExcel,
  resolveHscsExcelPath,
} from '@/app/hscs/server/parse-hscs-excel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department') ?? 'all'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const filePath = resolveHscsExcelPath()
    const parsed = parseHscsExcel(filePath)
    const dashboard = buildHscsExecutiveDashboard(parsed, {
      department,
      dateFrom,
      dateTo,
    })

    return NextResponse.json({ ok: true, data: dashboard })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          'วางไฟล์ HSCS69.xlsx ที่ apps/web/data/hscs/HSCS69.xlsx หรือรัน: bun scripts/generate-hscs-sample.mjs',
      },
      { status: 500 }
    )
  }
}
