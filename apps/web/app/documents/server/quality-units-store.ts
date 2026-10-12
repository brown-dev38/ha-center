import { Prisma } from '@prisma/client'
import { prisma } from '@/app/common/server/prisma'
import {
  DEFAULT_QUALITY_DOCUMENT_UNITS,
  QUALITY_UNIT_GROUPS,
  type QualityDocumentUnit,
  type QualityUnitGroup,
} from '@/app/documents/document-quality-units'

const SETTING_KEY = 'qualityDocumentUnits'

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

function asGroup(value: unknown): QualityUnitGroup | null {
  return QUALITY_UNIT_GROUPS.includes(value as QualityUnitGroup) ? (value as QualityUnitGroup) : null
}

function parseUnits(value: unknown): QualityDocumentUnit[] | null {
  if (!Array.isArray(value)) return null
  const units: QualityDocumentUnit[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Partial<QualityDocumentUnit>
    const code = typeof row.code === 'string' ? normalizeCode(row.code) : ''
    const name = typeof row.name === 'string' ? row.name.trim() : ''
    const id = typeof row.id === 'string' ? row.id.trim() : ''
    const group = asGroup(row.group)
    const order = Number(row.order)
    if (!id || !code || !name || !group || !Number.isFinite(order)) continue
    units.push({ id, order, code, name, group })
  }
  return units.sort((a, b) => a.order - b.order || a.code.localeCompare(b.code))
}

export async function listQualityDocumentUnits(): Promise<QualityDocumentUnit[]> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } })
  if (!row) return DEFAULT_QUALITY_DOCUMENT_UNITS
  return parseUnits(row.value) ?? DEFAULT_QUALITY_DOCUMENT_UNITS
}

async function saveUnits(units: QualityDocumentUnit[], updatedBy: string | null) {
  const value = [...units].sort((a, b) => a.order - b.order || a.code.localeCompare(b.code))
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: value as Prisma.InputJsonValue, updatedBy },
    update: { value: value as Prisma.InputJsonValue, updatedBy },
  })
  return value
}

export async function createQualityDocumentUnit(
  input: { order?: number; code: string; name: string; group: string },
  updatedBy: string | null
): Promise<QualityDocumentUnit> {
  const units = await listQualityDocumentUnits()
  const code = normalizeCode(input.code)
  const name = input.name.trim()
  const group = asGroup(input.group)
  if (!code) throw new Error('กรุณาระบุ CODE')
  if (!/^[A-Z0-9-]{1,12}$/.test(code)) throw new Error('CODE ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีด')
  if (!name) throw new Error('กรุณาระบุชื่อหน่วยงาน/ทีม')
  if (!group) throw new Error('กรุณาเลือกกลุ่ม')
  if (units.some((unit) => unit.code === code)) throw new Error('CODE นี้มีอยู่แล้ว')

  const order = Number.isFinite(input.order)
    ? Number(input.order)
    : Math.max(0, ...units.map((unit) => unit.order)) + 1
  const idBase = `qu-${code.toLowerCase()}`
  const id = units.some((unit) => unit.id === idBase) ? `${idBase}-${Date.now().toString(36)}` : idBase
  const created: QualityDocumentUnit = { id, order, code, name, group }
  await saveUnits([...units, created], updatedBy)
  return created
}

export async function updateQualityDocumentUnit(
  id: string,
  input: { order?: number; code?: string; name?: string; group?: string },
  updatedBy: string | null
): Promise<QualityDocumentUnit> {
  const units = await listQualityDocumentUnits()
  const current = units.find((unit) => unit.id === id)
  if (!current) throw new Error('ไม่พบหน่วยงาน/ทีม')

  const code = input.code !== undefined ? normalizeCode(input.code) : current.code
  const name = input.name !== undefined ? input.name.trim() : current.name
  const group = input.group !== undefined ? asGroup(input.group) : current.group
  if (!code) throw new Error('กรุณาระบุ CODE')
  if (!/^[A-Z0-9-]{1,12}$/.test(code)) throw new Error('CODE ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีด')
  if (!name) throw new Error('กรุณาระบุชื่อหน่วยงาน/ทีม')
  if (!group) throw new Error('กรุณาเลือกกลุ่ม')
  if (units.some((unit) => unit.id !== id && unit.code === code)) throw new Error('CODE นี้มีอยู่แล้ว')

  const order = input.order !== undefined && Number.isFinite(Number(input.order)) ? Number(input.order) : current.order
  const updated: QualityDocumentUnit = { ...current, order, code, name, group }
  await saveUnits(
    units.map((unit) => (unit.id === id ? updated : unit)),
    updatedBy
  )
  return updated
}

export async function deleteQualityDocumentUnit(id: string, updatedBy: string | null): Promise<QualityDocumentUnit> {
  const units = await listQualityDocumentUnits()
  const current = units.find((unit) => unit.id === id)
  if (!current) throw new Error('ไม่พบหน่วยงาน/ทีม')
  await saveUnits(
    units.filter((unit) => unit.id !== id),
    updatedBy
  )
  return current
}
