import type { Prisma } from '@prisma/client'

export type ParticipantBodyItem =
  | { userId: string; displayName?: never; departmentName?: never; positionTitle?: never }
  | { userId?: never; displayName: string; departmentName: string; positionTitle?: string }

export function normalizeParticipantItems(
  participants?: ParticipantBodyItem[],
  participantIds?: string[]
): ParticipantBodyItem[] {
  if (participants?.length) return participants
  return (participantIds ?? []).map((userId) => ({ userId }))
}

export async function replaceMeetingParticipants(
  tx: Prisma.TransactionClient,
  meetingId: string,
  items: ParticipantBodyItem[]
) {
  await tx.meetingParticipant.deleteMany({ where: { meetingId } })

  for (const item of items) {
    if ('userId' in item && item.userId) {
      const user = await tx.user.findUnique({
        where: { id: item.userId },
        select: {
          firstName: true,
          lastName: true,
          jobTitle: true,
          department: { select: { name: true } },
          role: { select: { displayName: true } },
        },
      })
      if (!user) continue

      const displayName = `${user.firstName} ${user.lastName}`.trim()
      await tx.meetingParticipant.create({
        data: {
          meetingId,
          userId: item.userId,
          displayName,
          departmentName: user.department?.name ?? null,
          positionTitle: user.jobTitle ?? user.role.displayName ?? null,
          status: 'invited',
        },
      })
    } else if (item.displayName && item.departmentName) {
      await tx.meetingParticipant.create({
        data: {
          meetingId,
          displayName: item.displayName.trim(),
          departmentName: item.departmentName.trim(),
          positionTitle: item.positionTitle?.trim() || null,
          status: 'invited',
        },
      })
    }
  }
}
