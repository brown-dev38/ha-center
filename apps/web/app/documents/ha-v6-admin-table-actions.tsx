'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { ArrowDownToLine } from 'lucide-react'
import type { HaV6CustomDocument } from '@/app/admin/admin-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { HaV6SectionId, HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'
import { useHaV6TrackerStore } from '@/app/documents/use-ha-v6-tracker'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import type { HaV6CustomGroup } from '@/app/admin/admin-api'
import { useSaveSettings } from '@/hooks/use-admin'
import { customDocToTracked, isHaV6CustomDocId, useHaV6DocLayout } from '@/hooks/use-app-config'
import { usePermissions } from '@/hooks/use-permissions'

const SECTION_DEFAULT_CODE: Record<HaV6SectionId, string> = {
  core: 'CORE',
  'section-i': 'I',
  'section-ii': 'II',
  'section-iii': 'III',
  'section-iv': 'IV',
  'sp-pct': 'SP/PCT',
}

function nextCustomId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function nextCustomGroupKey() {
  return `cgroup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

type HaV6DeleteRowButtonProps = {
  doc: HaV6TrackedDocument
  className?: string
}

/** ปุ่มลบแถว — ซ่อนแถว seed หรือลบแถวที่แอดมินเพิ่มเอง */
export function HaV6DeleteRowButton({ doc, className }: HaV6DeleteRowButtonProps) {
  const { isAdmin } = usePermissions()
  const layout = useHaV6DocLayout()
  const saveMutation = useSaveSettings()
  const removeDocument = useHaV6TrackerStore((s) => s.removeDocument)

  if (!isAdmin()) return null

  const isCustom = isHaV6CustomDocId(doc.id)

  const handleDelete = async () => {
    const label = doc.title.length > 60 ? `${doc.title.slice(0, 60)}…` : doc.title
    const message = isCustom
      ? `ลบรายการ "${label}" ออกจากตารางถาวร?`
      : `ซ่อนรายการ "${label}" ออกจากตาราง? (ข้อมูลสถานะ/ไฟล์ยังอยู่ในระบบ)`
    if (!window.confirm(message)) return

    try {
      if (isCustom) {
        await saveMutation.mutateAsync({
          haV6DocLayout: {
            custom: layout.custom.filter((c) => c.id !== doc.id),
          },
        })
        removeDocument(doc.id)
      } else if (!layout.hidden.includes(doc.id)) {
        await saveMutation.mutateAsync({
          haV6DocLayout: {
            hidden: [...layout.hidden, doc.id],
          },
        })
      }
      showSuccessToast(isCustom ? 'ลบรายการแล้ว' : 'ซ่อนรายการแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={saveMutation.isPending}
      title={isCustom ? 'ลบรายการ' : 'ซ่อนรายการ'}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5',
        'text-destructive/70 transition-all',
        'hover:border-destructive/40 hover:bg-destructive/15 hover:text-destructive',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30',
        className
      )}
    >
      {saveMutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </button>
  )
}

type HaV6AddDocumentButtonProps = {
  sectionId: HaV6SectionId
  documents: HaV6TrackedDocument[]
  groupLabels?: Record<string, string>
}

/** ปุ่มเพิ่มแถวใหม่ในตาราง HA ฉ.6 */
export function HaV6AddDocumentButton({
  sectionId,
  documents,
  groupLabels,
}: HaV6AddDocumentButtonProps) {
  const { isAdmin } = usePermissions()
  const layout = useHaV6DocLayout()
  const saveMutation = useSaveSettings()
  const ensureDocument = useHaV6TrackerStore((s) => s.ensureDocument)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('เอกสาร')
  const [responsible, setResponsible] = useState('')
  const [standardCode, setStandardCode] = useState(SECTION_DEFAULT_CODE[sectionId])
  const [subSection, setSubSection] = useState('')
  const [newGroupLabel, setNewGroupLabel] = useState('')

  if (!isAdmin()) return null

  const NEW_GROUP = '__new__'
  const customGroups = layout.customGroups.filter((g) => g.sectionId === sectionId)
  const seedGroupOptions = groupLabels
    ? Object.entries(groupLabels).map(([key, label]) => ({ key, label }))
    : []
  const customGroupOptions = customGroups.map((g) => ({ key: g.key, label: g.label }))
  const groupOptions = [...seedGroupOptions, ...customGroupOptions]

  const resetForm = () => {
    setTitle('')
    setDocType('เอกสาร')
    setResponsible('')
    setStandardCode(SECTION_DEFAULT_CODE[sectionId])
    setSubSection('')
    setNewGroupLabel('')
  }

  const handleOpen = () => {
    resetForm()
    setOpen(true)
  }

  const handleAdd = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      showErrorToast('กรุณาระบุชื่อรายการ')
      return
    }

    const layoutPatch: {
      custom: HaV6CustomDocument[]
      customGroups?: HaV6CustomGroup[]
    } = { custom: [...layout.custom] }

    let resolvedSubSection = subSection.trim() || undefined

    // สร้างกลุ่มย่อยใหม่ ถ้าเลือก "สร้างกลุ่มใหม่"
    if (subSection === NEW_GROUP) {
      const label = newGroupLabel.trim()
      if (!label) {
        showErrorToast('กรุณาระบุชื่อกลุ่มย่อย')
        return
      }
      const maxGroupOrder = layout.customGroups
        .filter((g) => g.sectionId === sectionId)
        .reduce((max, g) => Math.max(max, g.order), 0)
      const newGroup: HaV6CustomGroup = {
        key: nextCustomGroupKey(),
        sectionId,
        label,
        order: maxGroupOrder + 1,
      }
      layoutPatch.customGroups = [...layout.customGroups, newGroup]
      resolvedSubSection = newGroup.key
    }

    const maxOrder = documents.reduce((max, d) => Math.max(max, d.order), 0)
    const custom: HaV6CustomDocument = {
      id: nextCustomId(),
      sectionId,
      order: maxOrder + 1,
      standardCode: standardCode.trim() || SECTION_DEFAULT_CODE[sectionId],
      subSection: resolvedSubSection,
      title: trimmedTitle,
      docType: docType.trim() || 'เอกสาร',
      responsible: responsible.trim(),
      remarks: '',
    }
    layoutPatch.custom = [...layout.custom, custom]

    try {
      await saveMutation.mutateAsync({ haV6DocLayout: layoutPatch })
      ensureDocument(customDocToTracked(custom))
      showSuccessToast('เพิ่มรายการแล้ว')
      setOpen(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'เพิ่มรายการไม่สำเร็จ')
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleOpen}>
        <Plus className="size-4" />
        เพิ่มรายการ
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการในตาราง</DialogTitle>
            <DialogDescription>รายการใหม่จะแสดงให้ผู้ใช้ทุกคนเห็น</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ha-v6-add-title">ชื่อรายการ *</Label>
              <Input
                id="ha-v6-add-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อเอกสาร / รายการ"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ha-v6-add-type">ประเภทเอกสาร</Label>
                <Input
                  id="ha-v6-add-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ha-v6-add-code">รหัสมาตรฐาน</Label>
                <Input
                  id="ha-v6-add-code"
                  value={standardCode}
                  onChange={(e) => setStandardCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ha-v6-add-responsible">ผู้รับผิดชอบ</Label>
              <Input
                id="ha-v6-add-responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ha-v6-add-group">กลุ่มย่อย (แถวย่อย)</Label>
              <select
                id="ha-v6-add-group"
                value={subSection}
                onChange={(e) => setSubSection(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm outline-none focus-visible:border-primary"
              >
                <option value="">— ไม่ระบุ —</option>
                {groupOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
                <option value={NEW_GROUP}>+ สร้างกลุ่มย่อยใหม่…</option>
              </select>
            </div>
            {subSection === NEW_GROUP && (
              <div className="space-y-1.5">
                <Label htmlFor="ha-v6-add-newgroup">ชื่อกลุ่มย่อยใหม่ *</Label>
                <Input
                  id="ha-v6-add-newgroup"
                  value={newGroupLabel}
                  onChange={(e) => setNewGroupLabel(e.target.value)}
                  placeholder="เช่น หมวดเอกสารเพิ่มเติม"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={() => void handleAdd()}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'เพิ่มรายการ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type HaV6InsertRowButtonProps = {
  doc: HaV6TrackedDocument
  documents: HaV6TrackedDocument[]
  className?: string
}

/** ปุ่มแทรกแถวใหม่ต่อด้านล่างแถวที่ชี้ — สืบทอดกลุ่มย่อยเดียวกัน */
export function HaV6InsertRowButton({ doc, documents, className }: HaV6InsertRowButtonProps) {
  const { isAdmin } = usePermissions()
  const layout = useHaV6DocLayout()
  const saveMutation = useSaveSettings()
  const ensureDocument = useHaV6TrackerStore((s) => s.ensureDocument)

  if (!isAdmin()) return null

  const handleInsert = async () => {
    const sorted = [...documents].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((d) => d.id === doc.id)
    const next = idx >= 0 ? sorted[idx + 1] : undefined
    const newOrder = next ? (doc.order + next.order) / 2 : doc.order + 1

    const custom: HaV6CustomDocument = {
      id: nextCustomId(),
      sectionId: doc.sectionId,
      order: newOrder,
      standardCode: doc.standardCode || SECTION_DEFAULT_CODE[doc.sectionId],
      subSection: doc.subSection,
      title: 'รายการใหม่',
      docType: doc.docType || 'เอกสาร',
      responsible: '',
      remarks: '',
    }

    try {
      await saveMutation.mutateAsync({
        haV6DocLayout: { custom: [...layout.custom, custom] },
      })
      ensureDocument(customDocToTracked(custom))
      showSuccessToast('แทรกแถวใหม่แล้ว — กดดินสอเพื่อแก้ไขข้อความ')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'แทรกแถวไม่สำเร็จ')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleInsert()}
      disabled={saveMutation.isPending}
      title="แทรกแถวใหม่ด้านล่าง"
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/5',
        'text-primary/70 transition-all',
        'hover:border-primary/40 hover:bg-primary/15 hover:text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className
      )}
    >
      {saveMutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ArrowDownToLine className="size-3.5" />
      )}
    </button>
  )
}

type HaV6AddGroupButtonProps = {
  sectionId: HaV6SectionId
}

/** ปุ่มเพิ่มหัวข้อกลุ่มย่อย (แถวย่อย) ในตาราง HA ฉ.6 */
export function HaV6AddGroupButton({ sectionId }: HaV6AddGroupButtonProps) {
  const { isAdmin } = usePermissions()
  const layout = useHaV6DocLayout()
  const saveMutation = useSaveSettings()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')

  if (!isAdmin()) return null

  const handleOpen = () => {
    setLabel('')
    setOpen(true)
  }

  const handleAdd = async () => {
    const trimmed = label.trim()
    if (!trimmed) {
      showErrorToast('กรุณาระบุชื่อกลุ่มย่อย')
      return
    }
    const maxGroupOrder = layout.customGroups
      .filter((g) => g.sectionId === sectionId)
      .reduce((max, g) => Math.max(max, g.order), 0)
    const newGroup: HaV6CustomGroup = {
      key: nextCustomGroupKey(),
      sectionId,
      label: trimmed,
      order: maxGroupOrder + 1,
    }
    try {
      await saveMutation.mutateAsync({
        haV6DocLayout: { customGroups: [...layout.customGroups, newGroup] },
      })
      showSuccessToast('เพิ่มกลุ่มย่อยแล้ว')
      setOpen(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'เพิ่มกลุ่มย่อยไม่สำเร็จ')
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleOpen}>
        <Plus className="size-4" />
        เพิ่มกลุ่มย่อย
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มหัวข้อกลุ่มย่อย</DialogTitle>
            <DialogDescription>
              หัวข้อกลุ่มย่อยจะเป็นแถวคั่นในตาราง — ใช้จัดกลุ่มรายการเอกสาร
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="ha-v6-group-label">ชื่อกลุ่มย่อย *</Label>
            <Input
              id="ha-v6-group-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="เช่น I-7 หมวดเพิ่มเติม"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={() => void handleAdd()}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'เพิ่มกลุ่มย่อย'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** ปุ่มลบหัวข้อกลุ่มย่อยที่แอดมินเพิ่มเอง */
export function HaV6DeleteGroupButton({ groupKey }: { groupKey: string }) {
  const { isAdmin } = usePermissions()
  const layout = useHaV6DocLayout()
  const saveMutation = useSaveSettings()

  if (!isAdmin()) return null
  const isCustomGroup = layout.customGroups.some((g) => g.key === groupKey)
  if (!isCustomGroup) return null

  const handleDelete = async () => {
    if (!window.confirm('ลบกลุ่มย่อยนี้? (รายการในกลุ่มจะย้ายไปไม่มีกลุ่ม)')) return
    try {
      await saveMutation.mutateAsync({
        haV6DocLayout: {
          customGroups: layout.customGroups.filter((g) => g.key !== groupKey),
        },
      })
      showSuccessToast('ลบกลุ่มย่อยแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={saveMutation.isPending}
      title="ลบกลุ่มย่อย"
      className={cn(
        'ml-2 inline-flex size-6 items-center justify-center rounded-md border border-destructive/20 bg-white/60',
        'text-destructive/70 transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'
      )}
    >
      {saveMutation.isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Trash2 className="size-3" />
      )}
    </button>
  )
}

/** hook: รวม group labels จาก seed + custom ของ section */
export function useMergedGroupLabels(
  sectionId: HaV6SectionId,
  seedGroupLabels?: Record<string, string>
): Record<string, string> {
  const layout = useHaV6DocLayout()
  const merged: Record<string, string> = { ...(seedGroupLabels ?? {}) }
  for (const g of layout.customGroups) {
    if (g.sectionId === sectionId) merged[g.key] = g.label
  }
  return merged
}
