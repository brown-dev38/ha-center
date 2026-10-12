import { apiFetch } from '@/app/common/api-fetch'
import { apiHeaders } from '@/app/common/api-headers'
import { readApiData } from '@/app/common/parse-api-response'

// ─── Site settings / page text ─────────────────────────────────────

export type SiteSettings = {
  siteName: string
  siteSubtitle: string
  organizationName: string
  supportEmail: string
  footerNote: string
}

export type PageTextEntry = {
  title?: string
  description?: string
  /** หัวข้อตารางย่อย (เช่น ตาราง HA ฉ.6) */
  tableTitle?: string
  tableDescription?: string
}
export type PageTextSettings = Record<string, PageTextEntry>

export type CustomMenuLink = {
  id: string
  label: string
  href: string
  description?: string
  adminOnly?: boolean
}

export type MenuOverride = {
  hidden: string[]
  labels: Record<string, string>
  order: string[]
  custom: CustomMenuLink[]
}

export type MenuCatalogItem = {
  id: string
  label: string
  type: 'group' | 'link'
  href?: string
  adminOnly?: boolean
  children?: { id: string; label: string; href: string }[]
}

export type TableColumnOverride = {
  hidden: string[]
  labels: Record<string, string>
}

export type TableColumnSettings = Record<string, TableColumnOverride>

export type UILabelSettings = Record<string, string>

export type HaV6DocOverride = {
  title?: string
  docType?: string
  edition6Status?: string
  responsible?: string
  remarks?: string
  standardCode?: string
  order?: string
}
export type HaV6DocOverrides = Record<string, HaV6DocOverride>

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

export type AllSettings = {
  site: SiteSettings
  menu: MenuOverride
  pageText: PageTextSettings
  tableColumns: TableColumnSettings
  uiLabels: UILabelSettings
  haV6DocOverrides: HaV6DocOverrides
  haV6DocLayout: HaV6DocLayout
}

export type AdminOverview = {
  totalUsers: number
  activeUsers: number
  totalDocuments: number
  hiddenDocuments: number
  totalWorksheets: number
  departments: number
  categories: number
  recentAudit: number
}

export type AdminDepartment = {
  id: string
  code: string
  name: string
  nameEn: string | null
  isActive: boolean
  usersCount: number
}

export type AdminDocumentCategory = {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  documentCount: number
}

// ─── Settings ──────────────────────────────────────────────────────

export async function fetchSettings(): Promise<AllSettings> {
  const res = await apiFetch('/api/v1/admin/settings', { headers: apiHeaders(false) })
  return readApiData<AllSettings>(res)
}

export async function saveSettings(input: {
  site?: Partial<SiteSettings>
  pageText?: PageTextSettings
  tableColumns?: TableColumnSettings
  uiLabels?: UILabelSettings
  haV6DocOverrides?: HaV6DocOverrides
  haV6DocLayout?: Partial<HaV6DocLayout>
}): Promise<AllSettings> {
  const res = await apiFetch('/api/v1/admin/settings', {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<AllSettings>(res)
}

// ─── Menu ──────────────────────────────────────────────────────────

export async function fetchMenuConfig(): Promise<{
  catalog: MenuCatalogItem[]
  override: MenuOverride
}> {
  const res = await apiFetch('/api/v1/admin/menu', { headers: apiHeaders(false) })
  return readApiData<{ catalog: MenuCatalogItem[]; override: MenuOverride }>(res)
}

export async function saveMenuConfig(input: Partial<MenuOverride>): Promise<MenuOverride> {
  const res = await apiFetch('/api/v1/admin/menu', {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<MenuOverride>(res)
}

// ─── Overview ──────────────────────────────────────────────────────

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await apiFetch('/api/v1/admin/overview', { headers: apiHeaders(false) })
  return readApiData<AdminOverview>(res)
}

// ─── Departments CRUD ──────────────────────────────────────────────

export async function fetchAdminDepartmentsFull(): Promise<AdminDepartment[]> {
  const res = await apiFetch('/api/v1/admin/departments', { headers: apiHeaders(false) })
  return readApiData<AdminDepartment[]>(res)
}

export async function createDepartment(input: {
  code: string
  name: string
  nameEn?: string
}): Promise<AdminDepartment> {
  const res = await apiFetch('/api/v1/admin/departments', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<AdminDepartment>(res)
}

export async function updateDepartment(
  id: string,
  input: { code?: string; name?: string; nameEn?: string | null; isActive?: boolean }
): Promise<AdminDepartment> {
  const res = await apiFetch(`/api/v1/admin/departments/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<AdminDepartment>(res)
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/admin/departments/${id}`, {
    method: 'DELETE',
    headers: apiHeaders(false),
  })
  await readApiData(res)
}

// ─── Document categories CRUD ──────────────────────────────────────

export async function fetchAdminCategories(): Promise<AdminDocumentCategory[]> {
  const res = await apiFetch('/api/v1/admin/document-categories', { headers: apiHeaders(false) })
  return readApiData<AdminDocumentCategory[]>(res)
}

export async function createCategory(input: {
  code: string
  name: string
  description?: string
  sortOrder?: number
}): Promise<AdminDocumentCategory> {
  const res = await apiFetch('/api/v1/admin/document-categories', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<AdminDocumentCategory>(res)
}

export async function updateCategory(
  id: string,
  input: {
    code?: string
    name?: string
    description?: string | null
    sortOrder?: number
    isActive?: boolean
  }
): Promise<AdminDocumentCategory> {
  const res = await apiFetch(`/api/v1/admin/document-categories/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<AdminDocumentCategory>(res)
}

export async function fetchAdminRoles(): Promise<
  { id: string; name: string; displayName: string; description: string | null }[]
> {
  const res = await apiFetch('/api/v1/admin/roles', { headers: apiHeaders(false) })
  return readApiData(res)
}

export type QualityDocumentLevel = {
  id: string
  order: number
  code: string
  name: string
}

export async function fetchAdminQualityLevels(): Promise<QualityDocumentLevel[]> {
  const res = await apiFetch('/api/v1/admin/quality-levels', { headers: apiHeaders(false) })
  return readApiData<QualityDocumentLevel[]>(res)
}

export async function createQualityLevel(input: {
  order?: number
  code: string
  name: string
}): Promise<QualityDocumentLevel> {
  const res = await apiFetch('/api/v1/admin/quality-levels', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<QualityDocumentLevel>(res)
}

export async function updateQualityLevel(
  id: string,
  input: { order?: number; code?: string; name?: string }
): Promise<QualityDocumentLevel> {
  const res = await apiFetch(`/api/v1/admin/quality-levels/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<QualityDocumentLevel>(res)
}

export type QualityDocumentUnit = {
  id: string
  order: number
  code: string
  name: string
  group: string
}

export async function fetchAdminQualityUnits(): Promise<QualityDocumentUnit[]> {
  const res = await apiFetch('/api/v1/admin/quality-units', { headers: apiHeaders(false) })
  return readApiData<QualityDocumentUnit[]>(res)
}

export async function createQualityUnit(input: {
  order?: number
  code: string
  name: string
  group: string
}): Promise<QualityDocumentUnit> {
  const res = await apiFetch('/api/v1/admin/quality-units', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<QualityDocumentUnit>(res)
}

export async function updateQualityUnit(
  id: string,
  input: { order?: number; code?: string; name?: string; group?: string }
): Promise<QualityDocumentUnit> {
  const res = await apiFetch(`/api/v1/admin/quality-units/${id}`, {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(input),
  })
  return readApiData<QualityDocumentUnit>(res)
}

export async function deleteQualityUnit(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/admin/quality-units/${id}`, {
    method: 'DELETE',
    headers: apiHeaders(false),
  })
  await readApiData(res)
}

export async function deleteQualityLevel(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/admin/quality-levels/${id}`, {
    method: 'DELETE',
    headers: apiHeaders(false),
  })
  await readApiData(res)
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/admin/document-categories/${id}`, {
    method: 'DELETE',
    headers: apiHeaders(false),
  })
  await readApiData(res)
}
