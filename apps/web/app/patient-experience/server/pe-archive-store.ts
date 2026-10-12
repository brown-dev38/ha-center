import { Prisma } from '@prisma/client'
import { prisma } from '@/app/common/server/prisma'
import {
  normalizePeYearArchive,
  type PeYearArchive,
} from '@/app/patient-experience/pe-year-archive'

const SETTING_KEY = 'peSurveyArchive'
const MAX_PAYLOAD_CHARS = 15_000_000

type StoredArchive = {
  revision: number
  slots: PeYearArchive
}

export type PeArchiveSnapshot = {
  revision: number
  archive: PeYearArchive
}

function parseStored(value: unknown): StoredArchive {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown
    } catch {
      return { revision: 0, slots: {} }
    }
  }
  if (!parsed || typeof parsed !== 'object') return { revision: 0, slots: {} }
  const row = parsed as { revision?: unknown; slots?: unknown }
  return {
    revision: Number.isFinite(Number(row.revision)) ? Number(row.revision) : 0,
    slots: normalizePeYearArchive(row.slots ?? value),
  }
}

export async function readPeSurveyArchive(): Promise<PeArchiveSnapshot> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
  const stored = parseStored(row?.value)
  return { revision: stored.revision, archive: stored.slots }
}

export async function writePeSurveyArchive(
  archive: PeYearArchive,
  expectedRevision: number,
  updatedBy: string | null
): Promise<{ conflict: boolean; snapshot: PeArchiveSnapshot }> {
  const normalized = normalizePeYearArchive(archive)
  const payload = JSON.stringify(normalized)
  if (payload.length > MAX_PAYLOAD_CHARS) {
    throw new Error('PAYLOAD_TOO_LARGE')
  }

  try {
    return await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ value: Prisma.JsonValue }>>(
      Prisma.sql`SELECT value FROM app_settings WHERE \`key\` = ${SETTING_KEY} FOR UPDATE`
    )
    const current = parseStored(locked[0]?.value)
    if (current.revision !== expectedRevision) {
      return {
        conflict: true,
        snapshot: { revision: current.revision, archive: current.slots },
      }
    }

    const nextRevision = current.revision + 1
    const value = { revision: nextRevision, slots: normalized } as Prisma.InputJsonValue
    if (locked.length === 0) {
      await tx.appSetting.create({
        data: { key: SETTING_KEY, value, updatedBy },
      })
    } else {
      await tx.appSetting.update({
        where: { key: SETTING_KEY },
        data: { value, updatedBy },
      })
    }

    return {
      conflict: false,
      snapshot: { revision: nextRevision, archive: normalized },
    }
  })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { conflict: true, snapshot: await readPeSurveyArchive() }
    }
    throw error
  }
}
