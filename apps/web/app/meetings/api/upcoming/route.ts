import { successResponse } from '@/app/auth/server/auth-user'
import { prisma } from '@/app/common/server/prisma'
import { mapMeetingListItem } from '@/app/meetings/server/meetings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const meetings = await prisma.meeting.findMany({
    where: {
      startAt: { gte: now, lte: in7days },
      status: { notIn: ['cancelled', 'completed'] },
    },
    include: {
      room: true,
      organizer: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  return successResponse(meetings.map(mapMeetingListItem))
}
