import { prisma } from '@/app/common/server/prisma'

export function formatUserName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

export function mapMeetingListItem(
  meeting: {
    id: string
    title: string
    type: string
    status: string
    bookingStatus: string
    startAt: Date
    endAt: Date
    room: { id: string; name: string; code: string; capacity: number | null; location: string | null } | null
    organizer: { id: string; firstName: string; lastName: string }
    _count: { participants: number }
  }
) {
  return {
    id: meeting.id,
    title: meeting.title,
    type: meeting.type,
    status: meeting.status,
    bookingStatus: meeting.bookingStatus,
    startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(),
    room: meeting.room
      ? {
          id: meeting.room.id,
          name: meeting.room.name,
          code: meeting.room.code,
          capacity: meeting.room.capacity,
          location: meeting.room.location,
        }
      : null,
    organizer: {
      id: meeting.organizer.id,
      name: formatUserName(meeting.organizer.firstName, meeting.organizer.lastName),
    },
    participantsCount: meeting._count.participants,
  }
}

export async function fetchMeetingFull(id: string) {
  return prisma.meeting.findUnique({
    where: { id },
    include: {
      room: true,
      organizer: { select: { id: true, firstName: true, lastName: true } },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              department: { select: { id: true, name: true, code: true } },
              role: { select: { displayName: true } },
            },
          },
        },
      },
      agendas: {
        orderBy: { orderNo: 'asc' },
        include: {
          presenter: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      checklist: { orderBy: { sortOrder: 'asc' } },
      minutes: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export function mapMeetingDetail(meeting: NonNullable<Awaited<ReturnType<typeof fetchMeetingFull>>>) {
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    type: meeting.type,
    status: meeting.status,
    bookingStatus: meeting.bookingStatus,
    preparationStatus: meeting.preparationStatus,
    preparationNotes: meeting.preparationNotes,
    startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(),
    location: meeting.location,
    isOnline: meeting.isOnline,
    meetingUrl: meeting.meetingUrl,
    room: meeting.room
      ? {
          id: meeting.room.id,
          name: meeting.room.name,
          code: meeting.room.code,
          capacity: meeting.room.capacity,
          location: meeting.room.location,
        }
      : null,
    organizer: {
      id: meeting.organizer.id,
      name: formatUserName(meeting.organizer.firstName, meeting.organizer.lastName),
    },
    participants: meeting.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      isGuest: !p.userId,
      name: p.userId
        ? formatUserName(p.user!.firstName, p.user!.lastName)
        : (p.displayName ?? 'ไม่ระบุชื่อ'),
      departmentName: p.departmentName ?? p.user?.department?.name ?? null,
      departmentCode: p.user?.department?.code ?? null,
      positionTitle: p.positionTitle ?? p.user?.jobTitle ?? p.user?.role?.displayName ?? null,
      status: p.status,
    })),
    agendas: meeting.agendas.map((a) => {
      const linkFields = resolveStoredLinkFields(a.attachmentPath)
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        orderNo: a.orderNo,
        durationMinutes: a.durationMinutes,
        presenterId: a.presenterId,
        presenterName: a.presenter ? formatUserName(a.presenter.firstName, a.presenter.lastName) : a.presenterName,
        actualDurationSeconds: a.actualDurationSeconds,
        timerStatus: a.timerStatus,
        hasAttachment: !!a.attachmentPath,
        attachmentFileName: a.attachmentFileName,
        attachmentPath: a.attachmentPath ? `/api/v1/meetings/${meeting.id}/agendas/${a.id}/file` : null,
        attachmentSource: linkFields ? linkFields.source : a.attachmentPath ? ('upload' as const) : undefined,
        attachmentPreviewUrl: linkFields?.previewUrl,
        attachmentExternalUrl: linkFields?.externalUrl,
      }
    }),
    checklist: meeting.checklist.map((c) => ({
      id: c.id,
      title: c.title,
      isCompleted: c.isCompleted,
      sortOrder: c.sortOrder,
    })),
    minutes: meeting.minutes.map((m) => ({
      id: m.id,
      summary: m.summary,
      pdfPath: m.filePath ? `/api/v1/meetings/${meeting.id}/minutes/${m.id}/file` : null,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

export function buildMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function checkRoomAvailability(
  roomId: string,
  startAt: Date,
  endAt: Date,
  excludeMeetingId?: string
): Promise<{ available: boolean; conflict?: { id: string; title: string } }> {
  const conflict = await prisma.meeting.findFirst({
    where: {
      roomId,
      ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
      status: { notIn: ['cancelled'] },
      bookingStatus: { notIn: ['cancelled'] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true, title: true },
  })

  if (conflict) return { available: false, conflict }
  return { available: true }
}
