'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LayoutList,
  Link2,
  Plus,
  Save,
} from 'lucide-react'
import { AdminPageShell } from '@/app/admin/admin-page-shell'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useMenuConfig, useSaveMenuConfig } from '@/hooks/use-admin'
import type { CustomMenuLink, MenuCatalogItem, MenuOverride } from '@/app/admin/admin-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

type FlatMenuRow = {
  id: string
  label: string
  defaultLabel: string
  type: 'group' | 'link'
  href?: string
  parentId?: string
  adminOnly?: boolean
}

function flattenCatalog(catalog: MenuCatalogItem[]): FlatMenuRow[] {
  const rows: FlatMenuRow[] = []
  for (const item of catalog) {
    rows.push({
      id: item.id,
      label: item.label,
      defaultLabel: item.label,
      type: item.type,
      href: item.href,
      adminOnly: item.adminOnly,
    })
    if (item.children) {
      for (const child of item.children) {
        rows.push({
          id: child.id,
          label: child.label,
          defaultLabel: child.label,
          type: 'link',
          href: child.href,
          parentId: item.id,
        })
      }
    }
  }
  return rows
}

function applyOrder(rows: FlatMenuRow[], order: string[]): FlatMenuRow[] {
  const topLevel = rows.filter((r) => !r.parentId)
  const byParent = new Map<string, FlatMenuRow[]>()
  for (const row of rows) {
    if (!row.parentId) continue
    const list = byParent.get(row.parentId) ?? []
    list.push(row)
    byParent.set(row.parentId, list)
  }

  const rank = new Map(order.map((id, i) => [id, i]))
  const sortedTop = [...topLevel].sort(
    (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)
  )

  const result: FlatMenuRow[] = []
  for (const top of sortedTop) {
    result.push(top)
    const children = byParent.get(top.id) ?? []
    result.push(...children)
  }
  return result
}

export function MenuManagerPage() {
  const { data, isLoading } = useMenuConfig()
  const saveMutation = useSaveMenuConfig()
  const [override, setOverride] = useState<MenuOverride>({
    hidden: [],
    labels: {},
    order: [],
    custom: [],
  })
  const [customDraft, setCustomDraft] = useState<CustomMenuLink>({
    id: '',
    label: '',
    href: '',
    description: '',
  })

  useEffect(() => {
    if (data?.override) setOverride(data.override)
  }, [data])

  const rows = useMemo(() => {
    if (!data?.catalog) return []
    const flat = flattenCatalog(data.catalog)
    const ordered = applyOrder(flat, override.order)
    return ordered.map((row) => ({
      ...row,
      displayLabel: override.labels[row.id]?.trim() || row.defaultLabel,
      visible: !override.hidden.includes(row.id),
    }))
  }, [data, override])

  const topLevelIds = useMemo(
    () => rows.filter((r) => !r.parentId).map((r) => r.id),
    [rows]
  )

  const moveItem = (id: string, dir: -1 | 1) => {
    const order = override.order.length ? [...override.order] : [...topLevelIds]
    const idx = order.indexOf(id)
    if (idx < 0) return
    const next = idx + dir
    if (next < 0 || next >= order.length) return
    ;[order[idx], order[next]] = [order[next], order[idx]]
    setOverride((o) => ({ ...o, order }))
  }

  const toggleVisible = (id: string) => {
    setOverride((o) => {
      const hidden = new Set(o.hidden)
      if (hidden.has(id)) hidden.delete(id)
      else hidden.add(id)
      return { ...o, hidden: Array.from(hidden) }
    })
  }

  const setLabel = (id: string, label: string) => {
    setOverride((o) => ({
      ...o,
      labels: { ...o.labels, [id]: label },
    }))
  }

  const addCustomLink = () => {
    const id = customDraft.id.trim() || `custom-${Date.now()}`
    const label = customDraft.label.trim()
    const href = customDraft.href.trim()
    if (!label || !href) {
      showErrorToast('กรุณาระบุชื่อเมนูและ URL')
      return
    }
    setOverride((o) => ({
      ...o,
      custom: [...o.custom, { ...customDraft, id, label, href }],
    }))
    setCustomDraft({ id: '', label: '', href: '', description: '' })
  }

  const removeCustom = (id: string) => {
    setOverride((o) => ({ ...o, custom: o.custom.filter((c) => c.id !== id) }))
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(override)
      showSuccessToast('บันทึกการตั้งค่าเมนูแล้ว — รีเฟรช sidebar เพื่อดูผล')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  return (
    <AdminPageShell
      pageKey="admin-menu"
      title="จัดการเมนู"
      description="ซ่อน/แสดง แก้ชื่อ จัดลำดับเมนู sidebar และเพิ่มลิงก์ภายนอกหรือภายในระบบ"
      icon={LayoutList}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/20 px-5 py-3">
            <p className="text-sm font-semibold text-foreground">รายการเมนูในระบบ</p>
            <p className="text-xs text-muted-foreground">เมนูย่อยจะอยู่ใต้กลุ่มหลัก — ปรับได้ทีละรายการ</p>
          </div>

          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">กำลังโหลด...</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className={cn(
                    'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center',
                    row.parentId && 'bg-muted/10 pl-10',
                    !row.visible && 'opacity-55'
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {row.id}
                      </Badge>
                      {row.type === 'group' && <Badge variant="secondary">กลุ่ม</Badge>}
                      {row.adminOnly && <Badge className="bg-primary/10 text-primary">แอดมิน</Badge>}
                      {row.parentId && <span className="text-xs text-muted-foreground">↳ ย่อย</span>}
                    </div>
                    <Input
                      value={row.displayLabel}
                      onChange={(e) => setLabel(row.id, e.target.value)}
                      className="h-9"
                    />
                    {row.href && (
                      <p className="truncate font-mono text-xs text-muted-foreground">{row.href}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!row.parentId && (
                      <>
                        <Button type="button" variant="outline" size="icon" onClick={() => moveItem(row.id, -1)}>
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" onClick={() => moveItem(row.id, 1)}>
                          <ArrowDown className="size-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant={row.visible ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => toggleVisible(row.id)}
                    >
                      {row.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      {row.visible ? 'แสดง' : 'ซ่อน'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="size-4 text-primary" />
              <p className="font-semibold text-foreground">เพิ่มเมนูลิงก์</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>ชื่อเมนู</Label>
                <Input
                  value={customDraft.label}
                  onChange={(e) => setCustomDraft((d) => ({ ...d, label: e.target.value }))}
                  placeholder="เช่น คู่มือภายนอก"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  value={customDraft.href}
                  onChange={(e) => setCustomDraft((d) => ({ ...d, href: e.target.value }))}
                  placeholder="https:// หรือ /dashboard/..."
                />
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={addCustomLink}>
                <Plus className="size-4" />
                เพิ่มลิงก์
              </Button>
            </div>
            {override.custom.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
                {override.custom.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{c.label}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCustom(c.id)}>
                      ลบ
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          <Button
            type="button"
            className="w-full"
            disabled={saveMutation.isPending}
            onClick={() => void handleSave()}
          >
            <Save className="size-4" />
            {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าเมนู'}
          </Button>
        </div>
      </div>
    </AdminPageShell>
  )
}
