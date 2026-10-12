import { prisma } from '@/app/common/server/prisma'

/**
 * คลังตั้งค่าระบบหลังบ้านแบบ key/value (JSON) — เก็บในตาราง app_settings
 * ใช้ได้ทั้งฝั่ง server (service นี้) และดึงผ่าน API ไปแสดงบน UI
 */

export const SETTING_KEYS = {
  site: 'site',
  menu: 'menu',
  pageText: 'pageText',
  tableColumns: 'tableColumns',
  uiLabels: 'uiLabels',
  haV6DocOverrides: 'haV6DocOverrides',
  haV6DocLayout: 'haV6DocLayout',
} as const

export type SiteSettings = {
  siteName: string
  siteSubtitle: string
  organizationName: string
  supportEmail: string
  footerNote: string
}

export type MenuOverride = {
  /** id ของเมนูที่ถูกซ่อน */
  hidden: string[]
  /** id -> ชื่อเมนูที่แก้ไขใหม่ */
  labels: Record<string, string>
  /** ลำดับ id ของเมนูระดับบนสุด (id ที่ไม่อยู่ในนี้จะต่อท้าย) */
  order: string[]
  /** ลิงก์เมนูที่แอดมินเพิ่มเอง */
  custom: CustomMenuLink[]
}

export type CustomMenuLink = {
  id: string
  label: string
  href: string
  description?: string
  /** เฉพาะแอดมินเห็น */
  adminOnly?: boolean
}

/** ข้อความหัวข้อ/รายละเอียดของหน้า ที่แอดมินแก้ได้ */
export type PageTextEntry = {
  title?: string
  description?: string
  tableTitle?: string
  tableDescription?: string
}
export type PageTextSettings = Record<string, PageTextEntry>

export type TableColumnOverride = {
  hidden: string[]
  labels: Record<string, string>
}

export type TableColumnSettings = Record<string, TableColumnOverride>

/** ป้ายกำกับ UI ทั่วระบบ — key ตาม admin-registry */
export type UILabelSettings = Record<string, string>

/** แก้ไขข้อความรายการเอกสาร HA ฉ.6 ต่อแถว (override ค่า seed) */
export type HaV6DocOverride = {
  title?: string
  docType?: string
  edition6Status?: string
  responsible?: string
  remarks?: string
  standardCode?: string
  /** ลำดับ — เก็บเป็นข้อความ แปลงเป็นตัวเลขตอนแสดง */
  order?: string
}
export type HaV6DocOverrides = Record<string, HaV6DocOverride>

/** แถวที่แอดมินเพิ่มเอง + รายการที่ซ่อนจากตาราง */
export type HaV6CustomDocument = {
  id: string
  sectionId: string
  order: number
  standardCode: string
  subSection?: string
  title: string
  docType: string
  edition6Status?: string
  responsible: string
  remarks?: string
}

/** หัวข้อกลุ่มย่อยที่แอดมินเพิ่มเอง */
export type HaV6CustomGroup = {
  key: string
  sectionId: string
  label: string
  order: number
}

export type HaV6DocLayout = {
  hidden: string[]
  custom: HaV6CustomDocument[]
  customGroups: HaV6CustomGroup[]
}

export const DEFAULT_HA_V6_DOC_LAYOUT: HaV6DocLayout = {
  hidden: [],
  custom: [],
  customGroups: [],
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'ศูนย์ประสานงาน HA',
  siteSubtitle: 'โรงพยาบาลมหาวิทยาลัยพะเยา',
  organizationName: 'โรงพยาบาลมหาวิทยาลัยพะเยา',
  supportEmail: '',
  footerNote: '',
}

export const DEFAULT_MENU_OVERRIDE: MenuOverride = {
  hidden: [],
  labels: {},
  order: [],
  custom: [],
}

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.appSetting.findUnique({ where: { key } })
  if (!row) return fallback
  return { ...fallback, ...(row.value as object) } as T
}

async function writeSetting(key: string, value: unknown, updatedBy?: string | null) {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: value as object, updatedBy: updatedBy ?? null },
    update: { value: value as object, updatedBy: updatedBy ?? null },
  })
}

export function getSiteSettings() {
  return readSetting<SiteSettings>(SETTING_KEYS.site, DEFAULT_SITE_SETTINGS)
}

export function saveSiteSettings(value: Partial<SiteSettings>, updatedBy?: string | null) {
  return getSiteSettings().then((existing) =>
    writeSetting(SETTING_KEYS.site, { ...existing, ...value }, updatedBy)
  )
}

export function getMenuOverride() {
  return readSetting<MenuOverride>(SETTING_KEYS.menu, DEFAULT_MENU_OVERRIDE)
}

export function saveMenuOverride(value: Partial<MenuOverride>, updatedBy?: string | null) {
  return getMenuOverride().then((existing) =>
    writeSetting(SETTING_KEYS.menu, { ...existing, ...value }, updatedBy)
  )
}

export async function getPageText(): Promise<PageTextSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEYS.pageText } })
  return (row?.value as PageTextSettings) ?? {}
}

export function savePageText(value: PageTextSettings, updatedBy?: string | null) {
  return getPageText().then((existing) => {
    const merged = { ...existing }
    for (const [key, patch] of Object.entries(value)) {
      merged[key] = { ...(existing[key] ?? {}), ...patch }
    }
    return writeSetting(SETTING_KEYS.pageText, merged, updatedBy)
  })
}

export async function getTableColumnSettings(): Promise<TableColumnSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEYS.tableColumns } })
  return (row?.value as TableColumnSettings) ?? {}
}

export function saveTableColumnSettings(value: TableColumnSettings, updatedBy?: string | null) {
  return getTableColumnSettings().then((existing) => {
    const merged = { ...existing }
    for (const [tableId, patch] of Object.entries(value)) {
      const prev = existing[tableId] ?? { hidden: [], labels: {} }
      merged[tableId] = {
        hidden: patch.hidden ?? prev.hidden,
        labels: { ...prev.labels, ...(patch.labels ?? {}) },
      }
    }
    return writeSetting(SETTING_KEYS.tableColumns, merged, updatedBy)
  })
}

export async function getUILabels(): Promise<UILabelSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEYS.uiLabels } })
  return (row?.value as UILabelSettings) ?? {}
}

export function saveUILabels(value: UILabelSettings, updatedBy?: string | null) {
  return getUILabels().then((existing) =>
    writeSetting(SETTING_KEYS.uiLabels, { ...existing, ...value }, updatedBy)
  )
}

export async function getHaV6DocOverrides(): Promise<HaV6DocOverrides> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEYS.haV6DocOverrides } })
  return (row?.value as HaV6DocOverrides) ?? {}
}

export function saveHaV6DocOverrides(value: HaV6DocOverrides, updatedBy?: string | null) {
  return getHaV6DocOverrides().then((existing) => {
    const merged = { ...existing }
    for (const [id, patch] of Object.entries(value)) {
      merged[id] = { ...(existing[id] ?? {}), ...patch }
    }
    return writeSetting(SETTING_KEYS.haV6DocOverrides, merged, updatedBy)
  })
}

export async function getHaV6DocLayout(): Promise<HaV6DocLayout> {
  const row = await prisma.appSetting.findUnique({ where: { key: SETTING_KEYS.haV6DocLayout } })
  if (!row) return { ...DEFAULT_HA_V6_DOC_LAYOUT }
  const value = row.value as Partial<HaV6DocLayout>
  return {
    hidden: value.hidden ?? [],
    custom: value.custom ?? [],
    customGroups: value.customGroups ?? [],
  }
}

export function saveHaV6DocLayout(value: Partial<HaV6DocLayout>, updatedBy?: string | null) {
  return getHaV6DocLayout().then((existing) =>
    writeSetting(
      SETTING_KEYS.haV6DocLayout,
      {
        hidden: value.hidden ?? existing.hidden,
        custom: value.custom ?? existing.custom,
        customGroups: value.customGroups ?? existing.customGroups,
      },
      updatedBy
    )
  )
}

/** ดึงค่าทั้งหมดในครั้งเดียว (ใช้บนหน้าแอดมิน) */
export async function getAllSettings() {
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
  return { site, menu, pageText, tableColumns, uiLabels, haV6DocOverrides, haV6DocLayout }
}
