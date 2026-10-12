import { Prisma } from '@prisma/client'
import { prisma } from '@/app/common/server/prisma'
import {
  DEFAULT_QUALITY_DOCUMENT_LEVELS,
  type QualityDocumentLevel,
} from '@/app/documents/document-quality-levels'

const SETTING_KEY = 'qualityDocumentLevels'

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

function parseLevels(value: unknown): QualityDocumentLevel[] | null {
  if (!Array.isArray(value)) return null
  const levels: QualityDocumentLevel[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<QualityDocumentLevel>
    const code = typeof row.code === 'string' ? normalizeCode(row.code) : ''
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    const id = typeof row.id === 'string' ? row.id.trim() : ''
    const order = Number(row.order)
    if (!id || !code || !name || !Number.isFinite(order)) continue
    levels.push({ id, order, code, name })
  }
  return levels.sort((a, b) => a.order - b.order || a.code.localeCompare(b.code))
}

export async function listQualityDocumentLevels(): Promise<QualityDocumentLevel[]> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
  if (!row) return DEFAULT_QUALITY_DOCUMENT_LEVELS
  return parseLevels(row.value) ?? DEFAULT_QUALITY_DOCUMENT_LEVELS
}

async function saveLevels(levels: QualityDocumentLevel[], updatedBy: string | null) {
  const value = [...levels].sort((a, b) => a.order - b.order || a.code.localeCompare(b.code))
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: value as Prisma.InputJsonValue, updatedBy },
    update: { value: value as Prisma.InputJsonValue, updatedBy },
  })
  return value
}

export async function createQualityDocumentLevel(
  input: { order?: number; code: string; name: string },
  updatedBy: string | null
): Promise<QualityDocumentLevel> {
  const levels = await listQualityDocumentLevels()
  const code = normalizeCode(input.code)
  const name = input.name.trim()
  if (!code) throw new Error('กรุณาระบุ CODE')
  if (!/^[A-Z0-9-]{1,12}$/.test(code)) throw new Error('CODE ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีด')
  if (!name) throw new Error('กรุณาระบุชื่อระดับเอกสารคุณภาพ')
  if (levels.some((level) => level.code === code)) throw new Error('CODE นี้มีอยู่แล้ว')

  const order = Number.isFinite(input.order)
    ? Number(input.order)
    : Math.max(0, ...levels.map((level) => level.order)) + 1
  const idBase = `ql-${code.toLowerCase()}`
  const id = levels.some((level) => level.id === idBase) ? `${idBase}-${Date.now().toString(36)}` : idBase
  const created: QualityDocumentLevel = { id, order, code, name }
  await saveLevels([...levels, created], updatedBy)
  return created
}

export async function updateQualityDocumentLevel(
  id: string,
  input: { order?: number; code?: string; name?: string },
  updatedBy: string | null
): Promise<QualityDocumentLevel> {
  const levels = await listQualityDocumentLevels()
  const current = levels.find((level) => level.id === id)
  if (!current) throw new Error('ไม่พบระดับเอกสารคุณภาพ')

  const code = input.code !== undefined ? normalizeCode(input.code) : current.code
  const name = input.name !== undefined ? input.name.trim() : current.name
  if (!code) throw new Error('กรุณาระบุ CODE')
  if (!/^[A-Z0-9-]{1,12}$/.test(code)) throw new Error('CODE ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีด')
  if (!name) throw new Error('กรุณาระบุชื่อระดับเอกสารคุณภาพ')
  if (levels.some((level) => level.id !== id && level.code === code)) throw new Error('CODE นี้มีอยู่แล้ว')

  const next: QualityDocumentLevel = {
    ...current,
    code,
    name,
    order: Number.isFinite(input.order) ? Number(input.order) : current.order,
  }
  await saveLevels(
    levels.map((level) => (level.id === id ? next : level)),
    updatedBy
  )
  return next
}

export async function deleteQualityDocumentLevel(id: string, updatedBy: string | null) {
  const levels = await listQualityDocumentLevels()
  const current = levels.find((level) => level.id === id)
  if (!current) throw new Error('ไม่พบระดับเอกสารคุณภาพ')
  await saveLevels(
    levels.filter((level) => level.id !== id),
    updatedBy
  )
  return current
}
