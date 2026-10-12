'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiData } from '@/app/common/parse-api-response'
import type {
  HaV6CustomDocument,
  HaV6CustomGroup,
  HaV6DocLayout,
  HaV6DocOverrides,
  MenuOverride,
  PageTextSettings,
  SiteSettings,
  TableColumnSettings,
  UILabelSettings,
} from '@/app/admin/admin-api'
import { HA_V6_STATUS_OPTIONS, type HaV6DocStatus } from '@/app/documents/ha-v6-tracker-types'
import type { HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'

export type AppConfig = {
  site: SiteSettings
  menu: MenuOverride
  pageText: PageTextSettings
  tableColumns: TableColumnSettings
  uiLabels: UILabelSettings
  haV6DocOverrides: HaV6DocOverrides
  haV6DocLayout: HaV6DocLayout
}

const DEFAULT_CONFIG: AppConfig = {
  site: {
    siteName: 'ศูนย์ประสานงาน HA',
    siteSubtitle: 'โรงพยาบาลมหาวิทยาลัยพะเยา',
    organizationName: 'โรงพยาบาลมหาวิทยาลัยพะเยา',
    supportEmail: '',
    footerNote: '',
  },
  menu: { hidden: [], labels: {}, order: [], custom: [] },
  pageText: {},
  tableColumns: {},
  uiLabels: {},
  haV6DocOverrides: {},
  haV6DocLayout: { hidden: [], custom: [], customGroups: [] },
}

async function fetchAppConfig(): Promise<AppConfig> {
  const res = await apiFetch('/api/v1/common/app-config', { headers: apiHeaders(false) })
  return readApiData<AppConfig>(res)
}

export function useAppConfig() {
  const query = useQuery({
    queryKey: ['app-config'],
    queryFn: fetchAppConfig,
    staleTime: 60_000,
  })
  return { ...query, config: query.data ?? DEFAULT_CONFIG }
}

/** แปลง key ป้ายกำกับเป็นข้อความที่แสดง */
export function resolveUILabel(
  key: string,
  fallback: string,
  labels?: UILabelSettings
): string {
  const v = labels?.[key]?.trim()
  return v || fallback
}

/** ป้ายกำกับ UI ที่แอดมินแก้ได้ */
export function useUILabel(key: string, fallback: string): string {
  const { config } = useAppConfig()
  return resolveUILabel(key, fallback, config.uiLabels)
}

/** คอลัมน์ตารางที่แอดมินปรับได้ (ซ่อน/เปลี่ยนชื่อหัวคอลัมน์) */
export function useTableColumns(tableId: string, defaults: { id: string; label: string }[]) {
  const { config } = useAppConfig()
  const override = config.tableColumns[tableId]
  const hidden = new Set(override?.hidden ?? [])
  return defaults
    .filter((c) => !hidden.has(c.id))
    .map((c) => ({ ...c, label: override?.labels?.[c.id]?.trim() || c.label }))
}

export function isTableColumnVisible(tableId: string, columnId: string, config: AppConfig) {
  return !config.tableColumns[tableId]?.hidden?.includes(columnId)
}

/** ดึงข้อความหัวข้อ/รายละเอียดของหน้าที่แอดมินแก้ไว้ (ถ้าไม่มีใช้ค่า fallback) */
export function usePageText(
  key: string,
  fallback: {
    title: string
    description?: string
    tableTitle?: string
    tableDescription?: string
  }
) {
  const { config } = useAppConfig()
  const override = config.pageText[key]
  return {
    title: override?.title?.trim() || fallback.title,
    description: override?.description?.trim() || fallback.description,
    tableTitle: override?.tableTitle?.trim() || fallback.tableTitle,
    tableDescription: override?.tableDescription?.trim() || fallback.tableDescription,
  }
}

/** สถานะจัดทำเอกสาร HA ฉ.6 (รองรับการแก้ชื่อจากหลังบ้าน) */
export function useHaV6StatusOptions() {
  const { config } = useAppConfig()
  return useMemo(
    () =>
      HA_V6_STATUS_OPTIONS.map((opt) => ({
        ...opt,
        label: resolveUILabel(`haV6.status.${opt.value}`, opt.label, config.uiLabels),
      })),
    [config.uiLabels]
  )
}

export function useHaV6StatusLabel(status: HaV6DocStatus): string {
  const options = useHaV6StatusOptions()
  return options.find((o) => o.value === status)?.label ?? status
}

const EMPTY_DOC_LAYOUT: HaV6DocLayout = { hidden: [], custom: [], customGroups: [] }

/** override ข้อความรายการเอกสาร HA ฉ.6 จากหลังบ้าน */
export function useHaV6DocOverrides(): HaV6DocOverrides {
  const { config } = useAppConfig()
  return config.haV6DocOverrides ?? {}
}

export function useHaV6DocLayout(): HaV6DocLayout {
  const { config } = useAppConfig()
  const layout = config.haV6DocLayout
  if (!layout) return EMPTY_DOC_LAYOUT
  return {
    hidden: layout.hidden ?? [],
    custom: layout.custom ?? [],
    customGroups: layout.customGroups ?? [],
  }
}

export type { HaV6CustomGroup }

export function customDocToTracked(custom: HaV6CustomDocument): HaV6TrackedDocument {
  return {
    id: custom.id,
    sectionId: custom.sectionId as HaV6TrackedDocument['sectionId'],
    order: custom.order,
    standardCode: custom.standardCode,
    subSection: custom.subSection,
    title: custom.title,
    docType: custom.docType,
    edition6Status: custom.edition6Status,
    responsible: custom.responsible,
    status: 'not_started',
    progressPercent: 0,
    storageItems: [],
    remarks: custom.remarks ?? '',
  }
}

export function isHaV6CustomDocId(id: string): boolean {
  return id.startsWith('custom-')
}

export function applyHaV6DocOverrides(
  doc: HaV6TrackedDocument,
  overrides: HaV6DocOverrides
): HaV6TrackedDocument {
  const patch = overrides[doc.id]
  if (!patch) return doc
  const orderNum =
    patch.order !== undefined && patch.order !== '' && !Number.isNaN(Number(patch.order))
      ? Number(patch.order)
      : undefined
  return {
    ...doc,
    ...(patch.title !== undefined && patch.title !== '' ? { title: patch.title } : {}),
    ...(patch.docType !== undefined && patch.docType !== '' ? { docType: patch.docType } : {}),
    ...(patch.edition6Status !== undefined
      ? { edition6Status: patch.edition6Status || undefined }
      : {}),
    ...(patch.responsible !== undefined && patch.responsible !== ''
      ? { responsible: patch.responsible }
      : {}),
    ...(patch.remarks !== undefined ? { remarks: patch.remarks } : {}),
    ...(patch.standardCode !== undefined && patch.standardCode !== ''
      ? { standardCode: patch.standardCode }
      : {}),
    ...(orderNum !== undefined ? { order: orderNum } : {}),
  }
}
