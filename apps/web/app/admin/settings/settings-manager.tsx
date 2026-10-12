'use client'

import { useEffect, useMemo, useState } from 'react'
import { Columns3, FileText, Globe, Languages, RotateCcw, Save, Search, Settings } from 'lucide-react'
import { AdminPageShell } from '@/app/admin/admin-page-shell'
import {
  DOCUMENTS_TABLE_COLUMNS,
  HA_V6_TABLE_COLUMNS,
  PAGE_TEXT_GROUPS,
  UI_LABEL_GROUPS,
} from '@/app/admin/admin-registry'
import { HA_V6_ALL_SEED_DOCUMENTS } from '@/app/documents/ha-v6-all-seeds'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdminSettings, useSaveSettings } from '@/hooks/use-admin'
import type {
  HaV6DocOverrides,
  PageTextSettings,
  SiteSettings,
  TableColumnSettings,
  UILabelSettings,
} from '@/app/admin/admin-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

type Tab = 'site' | 'pages' | 'labels' | 'tables'

function TableColumnEditor({
  tableId,
  title,
  description,
  columns,
  override,
  onChange,
}: {
  tableId: string
  title: string
  description: string
  columns: readonly { id: string; label: string }[]
  override: { hidden: string[]; labels: Record<string, string> }
  onChange: (next: { hidden: string[]; labels: Record<string, string> }) => void
}) {
  const toggle = (id: string) => {
    const hidden = new Set(override.hidden)
    if (hidden.has(id)) hidden.delete(id)
    else hidden.add(id)
    onChange({ ...override, hidden: Array.from(hidden) })
  }

  return (
    <SurfaceCard className="overflow-hidden">
      <div className="border-b border-border/60 bg-muted/20 px-5 py-3">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ul className="divide-y divide-border/50">
        {columns.map((col) => {
          const visible = !override.hidden.includes(col.id)
          return (
            <li key={`${tableId}-${col.id}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-mono text-xs text-muted-foreground">{col.id}</p>
                <Input
                  value={override.labels[col.id] ?? col.label}
                  onChange={(e) =>
                    onChange({
                      ...override,
                      labels: { ...override.labels, [col.id]: e.target.value },
                    })
                  }
                />
              </div>
              <Button type="button" variant={visible ? 'outline' : 'secondary'} size="sm" onClick={() => toggle(col.id)}>
                {visible ? 'แสดง' : 'ซ่อน'}
              </Button>
            </li>
          )
        })}
      </ul>
    </SurfaceCard>
  )
}

export function SettingsManagerPage() {
  const { data, isLoading } = useAdminSettings()
  const saveMutation = useSaveSettings()
  const [tab, setTab] = useState<Tab>('labels')
  const [site, setSite] = useState<SiteSettings>({
    siteName: '',
    siteSubtitle: '',
    organizationName: '',
    supportEmail: '',
    footerNote: '',
  })
  const [pageText, setPageText] = useState<PageTextSettings>({})
  const [tableColumns, setTableColumns] = useState<TableColumnSettings>({})
  const [uiLabels, setUiLabels] = useState<UILabelSettings>({})
  const [haV6DocOverrides, setHaV6DocOverrides] = useState<HaV6DocOverrides>({})
  const [docSection, setDocSection] = useState<string>('core')
  const [docSearch, setDocSearch] = useState('')

  useEffect(() => {
    if (!data) return
    setSite(data.site)
    setPageText(data.pageText)
    setTableColumns(data.tableColumns)
    setUiLabels(data.uiLabels)
    setHaV6DocOverrides(data.haV6DocOverrides)
  }, [data])

  const docsOverride = tableColumns.documents ?? { hidden: [], labels: {} }
  const haV6ColsOverride = tableColumns['ha-v6-tracker'] ?? { hidden: [], labels: {} }

  const seedById = useMemo(
    () => Object.fromEntries(HA_V6_ALL_SEED_DOCUMENTS.map((d) => [d.id, d])),
    []
  )

  const filteredDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase()
    return HA_V6_ALL_SEED_DOCUMENTS.filter((d) => {
      if (d.sectionId !== docSection) return false
      if (!q) return true
      const o = haV6DocOverrides[d.id]
      const title = o?.title || d.title
      return (
        title.toLowerCase().includes(q) ||
        d.standardCode.toLowerCase().includes(q) ||
        (o?.docType || d.docType).toLowerCase().includes(q)
      )
    })
  }, [docSection, docSearch, haV6DocOverrides])

  const setPageField = (
    key: string,
    field: 'title' | 'description' | 'tableTitle' | 'tableDescription',
    value: string
  ) => {
    setPageText((p) => ({ ...p, [key]: { ...p[key], [field]: value } }))
  }

  const setUILabel = (key: string, value: string) => {
    setUiLabels((l) => ({ ...l, [key]: value }))
  }

  const setDocOverride = (id: string, field: keyof HaV6DocOverrides[string], value: string) => {
    setHaV6DocOverrides((o) => ({
      ...o,
      [id]: { ...o[id], [field]: value },
    }))
  }

  const resetDocOverride = (id: string) => {
    setHaV6DocOverrides((o) => {
      const next = { ...o }
      delete next[id]
      return next
    })
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ site, pageText, tableColumns, uiLabels, haV6DocOverrides })
      showSuccessToast('บันทึกการตั้งค่าแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Globe }[] = [
    { id: 'labels', label: 'ป้ายกำกับ & เนื้อหา', icon: Languages },
    { id: 'pages', label: 'ข้อความหน้า', icon: FileText },
    { id: 'tables', label: 'คอลัมน์ตาราง', icon: Columns3 },
    { id: 'site', label: 'ชื่อระบบ', icon: Globe },
  ]

  return (
    <AdminPageShell
      pageKey="admin-settings"
      title="ตั้งค่าระบบ"
      description="แก้ป้ายกำกับ ข้อความหน้า หัวคอลัมน์ และเนื้อหารายการเอกสาร HA ฉ.6"
      icon={Settings}
    >
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted'
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : (
        <>
          {tab === 'site' && (
            <SurfaceCard className="grid gap-4 p-6 sm:grid-cols-2">
              {(
                [
                  ['siteName', 'ชื่อระบบ (sidebar)'],
                  ['siteSubtitle', 'คำบรรยายใต้ชื่อ'],
                  ['organizationName', 'ชื่อองค์กร'],
                  ['supportEmail', 'อีเมลติดต่อ'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <Input value={site[key]} onChange={(e) => setSite((s) => ({ ...s, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>ข้อความท้ายหน้า (ถ้ามี)</Label>
                <textarea
                  className="flex min-h-[4rem] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary"
                  value={site.footerNote}
                  onChange={(e) => setSite((s) => ({ ...s, footerNote: e.target.value }))}
                  rows={2}
                />
              </div>
            </SurfaceCard>
          )}

          {tab === 'pages' && (
            <div className="space-y-8">
              {PAGE_TEXT_GROUPS.map((group) => (
                <section key={group.id} className="space-y-4">
                  <h3 className="font-heading text-base font-semibold text-foreground">{group.title}</h3>
                  <div className="grid gap-4">
                    {group.pages.map((page) => (
                      <SurfaceCard key={page.key} className="p-5">
                        <p className="mb-3 font-mono text-xs text-muted-foreground">key: {page.key}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>หัวข้อหน้า</Label>
                            <Input
                              value={pageText[page.key]?.title ?? ''}
                              placeholder={page.title}
                              onChange={(e) => setPageField(page.key, 'title', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label>คำอธิบาย</Label>
                            <textarea
                              className="flex min-h-[4rem] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary"
                              value={pageText[page.key]?.description ?? ''}
                              placeholder={page.description}
                              onChange={(e) => setPageField(page.key, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>
                          {'tableTitle' in page && page.tableTitle && (
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label>หัวข้อตาราง</Label>
                              <Input
                                value={pageText[page.key]?.tableTitle ?? ''}
                                placeholder={page.tableTitle}
                                onChange={(e) => setPageField(page.key, 'tableTitle', e.target.value)}
                              />
                            </div>
                          )}
                          {'tableDescription' in page && page.tableDescription && (
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label>คำอธิบายใต้ตาราง</Label>
                              <textarea
                                className="flex min-h-[3rem] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary"
                                value={pageText[page.key]?.tableDescription ?? ''}
                                placeholder={page.tableDescription}
                                onChange={(e) => setPageField(page.key, 'tableDescription', e.target.value)}
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      </SurfaceCard>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {tab === 'labels' && (
            <div className="space-y-6">
              {UI_LABEL_GROUPS.map((group) => (
                <SurfaceCard key={group.id} className="overflow-hidden">
                  <div className="border-b border-border/60 bg-muted/20 px-5 py-3">
                    <p className="font-semibold text-foreground">{group.title}</p>
                  </div>
                  <ul className="divide-y divide-border/50">
                    {group.labels.map((item) => (
                      <li key={item.key} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.2fr] sm:items-center">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.default}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{item.key}</p>
                          {item.hint && <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>}
                        </div>
                        <Input
                          value={uiLabels[item.key] ?? ''}
                          placeholder={item.default}
                          onChange={(e) => setUILabel(item.key, e.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                </SurfaceCard>
              ))}

              <SurfaceCard className="space-y-4 p-5">
                <div>
                  <h3 className="font-heading text-base font-semibold">เนื้อหารายการเอกสาร HA ฉ.6</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    แก้ชื่อเอกสาร ประเภท ผู้รับผิดชอบ และสถานะ ฉ.6 ในแต่ละแถว — ค่าว่างจะใช้ข้อความเริ่มต้น
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={docSection}
                    onChange={(e) => setDocSection(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="core">แกนหลัก (CORE)</option>
                    <option value="section-i">ตอน I</option>
                    <option value="section-ii">ตอน II</option>
                    <option value="section-iii">ตอน III</option>
                    <option value="section-iv">ตอน IV</option>
                    <option value="sp-pct">SP & PCT</option>
                  </select>
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="ค้นหาชื่อเอกสาร..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredDocs.map((doc) => {
                    const o = haV6DocOverrides[doc.id] ?? {}
                    const hasOverride = Boolean(haV6DocOverrides[doc.id])
                    return (
                      <div key={doc.id} className="rounded-xl border border-border/70 bg-muted/10 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs text-primary">{doc.standardCode}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">#{doc.order}</span>
                          </div>
                          {hasOverride && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => resetDocOverride(doc.id)}>
                              <RotateCcw className="size-3.5" />
                              คืนค่าเริ่มต้น
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="space-y-1.5 lg:col-span-2">
                            <Label>ชื่อเอกสาร / รายการ</Label>
                            <textarea
                              className="flex min-h-[3rem] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                              value={o.title ?? ''}
                              placeholder={seedById[doc.id]?.title}
                              onChange={(e) => setDocOverride(doc.id, 'title', e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>ประเภทเอกสาร</Label>
                            <Input
                              value={o.docType ?? ''}
                              placeholder={doc.docType}
                              onChange={(e) => setDocOverride(doc.id, 'docType', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>ผู้รับผิดชอบ</Label>
                            <Input
                              value={o.responsible ?? ''}
                              placeholder={doc.responsible}
                              onChange={(e) => setDocOverride(doc.id, 'responsible', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>สถานะใน ฉ.6</Label>
                            <Input
                              value={o.edition6Status ?? ''}
                              placeholder={doc.edition6Status ?? '—'}
                              onChange={(e) => setDocOverride(doc.id, 'edition6Status', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>หมายเหตุเริ่มต้น</Label>
                            <Input
                              value={o.remarks ?? ''}
                              placeholder={doc.remarks || '—'}
                              onChange={(e) => setDocOverride(doc.id, 'remarks', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {filteredDocs.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">ไม่พบรายการในหมวดนี้</p>
                  )}
                </div>
              </SurfaceCard>
            </div>
          )}

          {tab === 'tables' && (
            <div className="space-y-6">
              <TableColumnEditor
                tableId="documents"
                title="ตารางเอกสารมาตรฐาน HA"
                description="ซ่อนหรือเปลี่ยนชื่อหัวคอลัมน์"
                columns={DOCUMENTS_TABLE_COLUMNS}
                override={docsOverride}
                onChange={(next) => setTableColumns((t) => ({ ...t, documents: next }))}
              />
              <TableColumnEditor
                tableId="ha-v6-tracker"
                title="ตารางติดตามเอกสาร HA ฉ.6"
                description="ซ่อนหรือเปลี่ยนชื่อหัวคอลัมน์ในตาราง CORE / ตอน I–IV"
                columns={HA_V6_TABLE_COLUMNS}
                override={haV6ColsOverride}
                onChange={(next) => setTableColumns((t) => ({ ...t, 'ha-v6-tracker': next }))}
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" disabled={saveMutation.isPending} onClick={() => void handleSave()}>
              <Save className="size-4" />
              {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </Button>
          </div>
        </>
      )}
    </AdminPageShell>
  )
}
