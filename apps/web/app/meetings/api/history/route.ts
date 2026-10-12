import { NextRequest } from 'next/server'
import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'
import { buildMonthRange } from '@/app/meetings/server/meetings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const skip = (page - 1) * limit

  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const dateFilter =
    year && month
      ? buildMonthRange(Number(year), Number(month))
      : null

  const where = {
    status: 'completed' as const,
    ...(dateFilter ? { startAt: { gte: dateFilter.start, lte: dateFilter.end } } : {}),
  }

  const [total, meetings] = await Promise.all([
    prisma.meeting.count({ where }),
    prisma.meeting.findMany({
      where,
      include: {
        room: true,
        minutes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { startAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  const data = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    status: m.status,
    startAt: m.startAt.toISOString(),
    endAt: m.endAt.toISOString(),
    room: m.room
      ? {
          id: m.room.id,
          name: m.room.name,
          code: m.room.code,
          capacity: m.room.capacity,
          location: m.room.location,
        }
      : null,
    minutesPdfPath: m.minutes[0]?.filePath ? `/api/v1/meetings/${m.id}/minutes/${m.minutes[0].id}/file` : null,
  }))

  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
  })
}
