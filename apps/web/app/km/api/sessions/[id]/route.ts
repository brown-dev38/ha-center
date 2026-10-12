import { NextRequest } from 'next/server'
import { errorResponse, successResponse } from '@/app/auth/server/auth-user'
import { fetchKmSessionDetail, mapKmSession } from '@/app/km/server/km'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await fetchKmSessionDetail(id)

  if (!session) {
    return errorResponse(404, 'ไม่พบ KM Session', 'KM_SESSION_NOT_FOUND')
  }

  return successResponse({
    ...mapKmSession({ ...session, _count: { results: session.results.length } }),
    results: session.results.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl,
      systemUrl: r.systemUrl,
    })),
    innovations: session.innovations.map((i) => ({
      id: i.id,
      title: i.title,
      innovationType: i.innovationType,
      description: i.description,
      result: i.result,
      year: i.year,
    })),
  })
}
