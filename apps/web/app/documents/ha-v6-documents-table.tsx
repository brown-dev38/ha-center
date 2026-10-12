'use client'

import type { CSSProperties, LucideIcon } from 'react'
import { HA_V6_TABLE_COLUMNS } from '@/app/admin/admin-registry'
import {
  AdminEditableHeader,
  AdminEditableText,
  AdminEditModeHint,
} from '@/app/admin/admin-inline-edit'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import {
  HaV6AddDocumentButton,
  HaV6AddGroupButton,
  HaV6DeleteGroupButton,
  HaV6DeleteRowButton,
  HaV6InsertRowButton,
  useMergedGroupLabels,
} from '@/app/documents/ha-v6-admin-table-actions'
import { HA_V6_ALL_SEED_DOCUMENTS } from '@/app/documents/ha-v6-all-seeds'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { WideTableScroll } from '@/app/common/ui/wide-table-scroll'
import { cn } from '@/app/common/utils'
import {
  useHaV6StatusLabel,
  useHaV6StatusOptions,
  useTableColumns,
  useUILabel,
  resolveUILabel,
  useAppConfig,
} from '@/hooks/use-app-config'
import type { HaV6DocStatus, HaV6SectionId, HaV6TrackedDocument } from '@/app/documents/ha-v6-tracker-types'
import { useHaV6DocumentMutations, useHaV6TrackerStore } from '@/app/documents/use-ha-v6-tracker'
import { HaV6StorageCell, HaV6StorageColumnHint } from '@/app/documents/ha-v6-storage-cell'
import { DocumentUpdateStatus } from '@/app/documents/document-update-status'
import { getHaV6DocumentUpdatedAt } from '@/app/documents/ha-v6-storage-utils'
import { usePermissions } from '@/hooks/use-permissions'

const SEED_BY_ID = Object.fromEntries(HA_V6_ALL_SEED_DOCUMENTS.map((d) => [d.id, d]))

const STATUS_CELL_CLASS: Record<HaV6DocStatus, string> = {
  not_started: 'bg-rose-100 text-rose-800 border-rose-200',
  in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
  review: 'bg-amber-100 text-amber-900 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

/** ความกว้างคอลัมน์ (px) — ใช้คำนวณ min-width ตามคอลัมน์ที่เปิด */
const COL_WIDTH_PX: Record<string, number> = {
  __admin: 80,
  order: 56,
  standardCode: 88,
  title: 280,
  docType: 112,
  edition6Status: 96,
  responsible: 148,
  storage: 220,
  remarks: 148,
  progress: 72,
  status: 128,
}

const LEFT_STICKY_IDS = ['order', 'standardCode', 'title'] as const
const RIGHT_STICKY_IDS = ['progress', 'status'] as const

function useHaV6TableLayout(showAdminActions: boolean) {
  const columns = useTableColumns('ha-v6-tracker', [...HA_V6_TABLE_COLUMNS])
  const visible = new Set(columns.map((c) => c.id))
  const label = (id: string, fallback: string) =>
    columns.find((c) => c.id === id)?.label ?? fallback

  let leftCursor = 0
  const leftOffset: Record<string, number> = {}
  if (showAdminActions) {
    leftOffset.__admin = 0
    leftCursor = COL_WIDTH_PX.__admin
  }
  for (const id of LEFT_STICKY_IDS) {
    if (!visible.has(id)) continue
    leftOffset[id] = leftCursor
    leftCursor += COL_WIDTH_PX[id]
  }

  let rightCursor = 0
  const rightOffset: Record<string, number> = {}
  for (const id of [...RIGHT_STICKY_IDS].reverse()) {
    if (!visible.has(id)) continue
    rightOffset[id] = rightCursor
    rightCursor += COL_WIDTH_PX[id]
  }

  let minWidth = showAdminActions ? COL_WIDTH_PX.__admin : 0
  for (const col of columns) {
    minWidth += COL_WIDTH_PX[col.id] ?? 120
  }

  return {
    visible,
    label,
    colCount: columns.length,
    leftOffset,
    rightOffset,
    minWidth,
  }
}

function stickyCellClass({
  side,
  isHeader,
  edge,
}: {
  side: 'left' | 'right'
  isHeader?: boolean
  edge?: boolean
}) {
  return cn(
    'sticky z-20',
    isHeader ? 'bg-slate-100' : 'bg-white group-hover/row:bg-slate-50',
    side === 'left' && edge && 'border-r border-border/60 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.12)]',
    side === 'right' && edge && 'border-l border-border/60 shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.12)]'
  )
}

function stickyStyle(side: 'left' | 'right', offset: number): CSSProperties {
  return side === 'left' ? { left: offset } : { right: offset }
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: HaV6DocStatus
  onChange: (status: HaV6DocStatus) => void
  disabled?: boolean
}) {
  const options = useHaV6StatusOptions()
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as HaV6DocStatus)}
      className={cn(
        'w-full min-w-[7rem] rounded-md border px-2 py-1.5 text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-primary/30',
        STATUS_CELL_CLASS[value],
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function DocumentRow({
  doc,
  canEdit,
  showAdminActions,
  documents,
}: {
  doc: HaV6TrackedDocument
  canEdit: boolean
  showAdminActions: boolean
  documents: HaV6TrackedDocument[]
}) {
  const { visible, leftOffset, rightOffset } = useHaV6TableLayout(showAdminActions)
  const statusLabel = useHaV6StatusLabel(doc.status)
  const remarksPlaceholder = useUILabel('haV6.remarks.placeholder', 'หมายเหตุ')
  const emptyDash = useUILabel('common.empty', '—')
  const { updateDocument, setDocumentStatus } = useHaV6DocumentMutations()
  const patchLocal = useHaV6TrackerStore((s) => s.patchLocal)
  const seed = SEED_BY_ID[doc.id]

  const leftEdgeId = [...LEFT_STICKY_IDS].reverse().find((id) => visible.has(id))
  const rightEdgeId = RIGHT_STICKY_IDS.find((id) => visible.has(id))

  return (
    <tr className="group/row border-b border-border/50 bg-white hover:bg-slate-50/60">
      {showAdminActions && (
        <td
          className={cn(
            'w-20 px-2 py-2.5 align-middle',
            stickyCellClass({ side: 'left', edge: false })
          )}
          style={stickyStyle('left', leftOffset.__admin ?? 0)}
        >
          <div className="flex items-center justify-center gap-1">
            <HaV6InsertRowButton doc={doc} documents={documents} />
            <HaV6DeleteRowButton doc={doc} />
          </div>
        </td>
      )}
      {visible.has('order') && (
        <td
          className={cn(
            'w-14 px-2 py-2.5 text-center tabular-nums text-foreground/80',
            stickyCellClass({ side: 'left', edge: leftEdgeId === 'order' })
          )}
          style={stickyStyle('left', leftOffset.order)}
        >
          <AdminEditableText
            value={String(doc.order)}
            defaultValue={seed ? String(seed.order) : undefined}
            scope={{ kind: 'ha-v6-doc', docId: doc.id, field: 'order', label: 'ลำดับ' }}
          />
        </td>
      )}
      {visible.has('standardCode') && (
        <td
          className={cn(
            'w-[5.5rem] px-2 py-2.5 text-center text-xs font-medium text-primary/90',
            stickyCellClass({ side: 'left', edge: leftEdgeId === 'standardCode' })
          )}
          style={stickyStyle('left', leftOffset.standardCode)}
        >
          <AdminEditableText
            value={doc.standardCode}
            defaultValue={seed?.standardCode}
            scope={{ kind: 'ha-v6-doc', docId: doc.id, field: 'standardCode', label: 'รหัสมาตรฐาน' }}
          />
        </td>
      )}
      {visible.has('title') && (
        <td
          className={cn(
            'min-w-[17.5rem] max-w-[22rem] px-3 py-2.5 text-sm leading-relaxed text-foreground/90',
            stickyCellClass({ side: 'left', edge: leftEdgeId === 'title' })
          )}
          style={stickyStyle('left', leftOffset.title)}
        >
          <AdminEditableText
            value={doc.title}
            defaultValue={seed?.title}
            multiline
            scope={{ kind: 'ha-v6-doc', docId: doc.id, field: 'title', label: 'ชื่อเอกสาร / รายการ' }}
          />
          <DocumentUpdateStatus
            className="mt-2"
            compact
            updatedAt={getHaV6DocumentUpdatedAt(doc)}
          />
        </td>
      )}
      {visible.has('docType') && (
        <td className="min-w-[7rem] max-w-[9rem] whitespace-nowrap px-3 py-2.5 text-sm text-foreground/80">
          <AdminEditableText
            value={doc.docType}
            defaultValue={seed?.docType}
            scope={{ kind: 'ha-v6-doc', docId: doc.id, field: 'docType', label: 'ประเภทเอกสาร' }}
          />
        </td>
      )}
      {visible.has('edition6Status') && (
        <td className="min-w-[6rem] px-3 py-2.5 text-center">
          {doc.edition6Status ? (
            <span className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
              <AdminEditableText
                value={doc.edition6Status}
                defaultValue={seed?.edition6Status}
                scope={{
                  kind: 'ha-v6-doc',
                  docId: doc.id,
                  field: 'edition6Status',
                  label: 'สถานะใน ฉ.6',
                }}
              />
            </span>
          ) : (
            <AdminEditableText
              value=""
              placeholder={emptyDash}
              defaultValue={seed?.edition6Status}
              scope={{
                kind: 'ha-v6-doc',
                docId: doc.id,
                field: 'edition6Status',
                label: 'สถานะใน ฉ.6',
              }}
            />
          )}
        </td>
      )}
      {visible.has('responsible') && (
        <td className="min-w-[9rem] max-w-[12rem] px-3 py-2.5 text-sm text-foreground/80">
          <AdminEditableText
            value={doc.responsible}
            defaultValue={seed?.responsible}
            scope={{ kind: 'ha-v6-doc', docId: doc.id, field: 'responsible', label: 'ผู้รับผิดชอบ' }}
          />
        </td>
      )}
      {visible.has('storage') && (
        <td className="min-w-[13.75rem] max-w-[18rem] px-3 py-2.5">
          <HaV6StorageCell doc={doc} canEdit={canEdit} />
        </td>
      )}
      {visible.has('remarks') && (
        <td className="min-w-[9rem] max-w-[14rem] px-3 py-2.5">
          {canEdit ? (
            <input
              type="text"
              value={doc.remarks}
              onChange={(e) => patchLocal(doc.id, { remarks: e.target.value })}
              onBlur={(e) => updateDocument(doc.id, { remarks: e.target.value })}
              placeholder={remarksPlaceholder}
              className="w-full min-w-[6rem] rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
          ) : (
            <span className="text-xs text-muted-foreground">{doc.remarks || emptyDash}</span>
          )}
        </td>
      )}
      {visible.has('progress') && (
        <td
          className={cn(
            'w-[4.5rem] px-2 py-2.5',
            stickyCellClass({ side: 'right', edge: rightEdgeId === 'progress' })
          )}
          style={stickyStyle('right', rightOffset.progress)}
        >
          {canEdit ? (
            <input
              type="number"
              min={0}
              max={100}
              value={doc.progressPercent}
              onChange={(e) =>
                patchLocal(doc.id, {
                  progressPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
              onBlur={(e) =>
                updateDocument(doc.id, {
                  progressPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                })
              }
              className="w-14 rounded-md border border-input bg-background px-1.5 py-1 text-center text-xs tabular-nums"
            />
          ) : (
            <span className="text-sm tabular-nums text-foreground/80">
              {doc.progressPercent > 0 ? doc.progressPercent : emptyDash}
            </span>
          )}
        </td>
      )}
      {visible.has('status') && (
        <td
          className={cn(
            'min-w-[8rem] px-2 py-2.5',
            stickyCellClass({ side: 'right', edge: rightEdgeId === 'status' })
          )}
          style={stickyStyle('right', rightOffset.status)}
        >
          {canEdit ? (
            <StatusSelect value={doc.status} onChange={(status) => setDocumentStatus(doc.id, status)} />
          ) : (
            <span
              className={cn(
                'inline-flex rounded-md border px-2 py-1 text-xs font-semibold',
                STATUS_CELL_CLASS[doc.status]
              )}
            >
              {statusLabel}
            </span>
          )}
        </td>
      )}
    </tr>
  )
}

function GroupHeaderRow({
  groupKey,
  label,
  defaultLabel,
  colSpan,
}: {
  groupKey: string
  label: string
  defaultLabel: string
  colSpan: number
}) {
  return (
    <tr className="border-b border-sky-200/80 bg-sky-50/90">
      <td colSpan={colSpan} className="px-4 py-2.5 text-sm font-semibold text-[#1e5a9e]">
        <span className="inline-flex items-center">
          <AdminEditableText
            value={label}
            defaultValue={defaultLabel}
            scope={{ kind: 'ha-v6-group', groupKey, label: 'หัวข้อกลุ่มย่อย' }}
          />
          <HaV6DeleteGroupButton groupKey={groupKey} />
        </span>
      </td>
    </tr>
  )
}

function HaV6TableHeaderRow({ showAdminActions }: { showAdminActions: boolean }) {
  const { visible, label, leftOffset, rightOffset } = useHaV6TableLayout(showAdminActions)
  const col = (id: string, fallback: string) => label(id, fallback)
  const leftEdgeId = [...LEFT_STICKY_IDS].reverse().find((id) => visible.has(id))
  const rightEdgeId = RIGHT_STICKY_IDS.find((id) => visible.has(id))

  return (
    <tr className="border-b border-border/70 bg-slate-100/90 text-left">
      {showAdminActions && (
        <th
          className={cn(
            'w-20 px-2 py-3 text-center font-semibold text-muted-foreground',
            stickyCellClass({ side: 'left', isHeader: true, edge: false })
          )}
          style={stickyStyle('left', leftOffset.__admin ?? 0)}
        >
          จัดการ
        </th>
      )}
      {visible.has('order') && (
        <th
          className={cn(
            'w-12 px-2 py-3 text-center font-semibold',
            stickyCellClass({ side: 'left', isHeader: true, edge: leftEdgeId === 'order' })
          )}
          style={stickyStyle('left', leftOffset.order)}
        >
          <AdminEditableHeader
            as="span"
            value={col('order', 'ลำดับ')}
            scope={{ kind: 'table-column', tableId: 'ha-v6-tracker', columnId: 'order', label: 'หัวคอลัมน์: ลำดับ' }}
          />
        </th>
      )}
      {visible.has('standardCode') && (
        <th
          className={cn(
            'w-[5.5rem] px-2 py-3 text-center font-semibold',
            stickyCellClass({ side: 'left', isHeader: true, edge: leftEdgeId === 'standardCode' })
          )}
          style={stickyStyle('left', leftOffset.standardCode)}
        >
          <AdminEditableHeader
            as="span"
            value={col('standardCode', 'รหัสมาตรฐาน')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'standardCode',
              label: 'หัวคอลัมน์: รหัสมาตรฐาน',
            }}
          />
        </th>
      )}
      {visible.has('title') && (
        <th
          className={cn(
            'min-w-[17.5rem] px-3 py-3 font-semibold',
            stickyCellClass({ side: 'left', isHeader: true, edge: leftEdgeId === 'title' })
          )}
          style={stickyStyle('left', leftOffset.title)}
        >
          <AdminEditableHeader
            as="span"
            value={col('title', 'รายการเอกสาร')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'title',
              label: 'หัวคอลัมน์: รายการเอกสาร',
            }}
          />
        </th>
      )}
      {visible.has('docType') && (
        <th className="min-w-[7rem] px-3 py-3 font-semibold">
          <AdminEditableHeader
            as="span"
            value={col('docType', 'ประเภทเอกสาร')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'docType',
              label: 'หัวคอลัมน์: ประเภทเอกสาร',
            }}
          />
        </th>
      )}
      {visible.has('edition6Status') && (
        <th className="min-w-[6rem] px-3 py-3 text-center font-semibold">
          <AdminEditableHeader
            as="span"
            value={col('edition6Status', 'สถานะใน ฉ.6')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'edition6Status',
              label: 'หัวคอลัมน์: สถานะใน ฉ.6',
            }}
          />
        </th>
      )}
      {visible.has('responsible') && (
        <th className="min-w-[9rem] px-3 py-3 font-semibold">
          <AdminEditableHeader
            as="span"
            value={col('responsible', 'ผู้รับผิดชอบ / ทีมนำ')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'responsible',
              label: 'หัวคอลัมน์: ผู้รับผิดชอบ',
            }}
          />
        </th>
      )}
      {visible.has('storage') && (
        <th className="min-w-[13.75rem] px-3 py-3 font-semibold">
          <span className="block">
            <AdminEditableHeader
              as="span"
              value={col('storage', 'ที่จัดเก็บ / ลิงก์')}
              scope={{
                kind: 'table-column',
                tableId: 'ha-v6-tracker',
                columnId: 'storage',
                label: 'หัวคอลัมน์: ที่จัดเก็บ / ลิงก์',
              }}
            />
          </span>
          <HaV6StorageColumnHint />
        </th>
      )}
      {visible.has('remarks') && (
        <th className="min-w-[9rem] px-3 py-3 font-semibold">
          <AdminEditableHeader
            as="span"
            value={col('remarks', 'หมายเหตุ')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'remarks',
              label: 'หัวคอลัมน์: หมายเหตุ',
            }}
          />
        </th>
      )}
      {visible.has('progress') && (
        <th
          className={cn(
            'w-[4.5rem] px-2 py-3 font-semibold',
            stickyCellClass({ side: 'right', isHeader: true, edge: rightEdgeId === 'progress' })
          )}
          style={stickyStyle('right', rightOffset.progress)}
        >
          <AdminEditableHeader
            as="span"
            value={col('progress', '% คืบหน้า')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'progress',
              label: 'หัวคอลัมน์: % คืบหน้า',
            }}
          />
        </th>
      )}
      {visible.has('status') && (
        <th
          className={cn(
            'min-w-[8rem] px-2 py-3 font-semibold',
            stickyCellClass({ side: 'right', isHeader: true, edge: rightEdgeId === 'status' })
          )}
          style={stickyStyle('right', rightOffset.status)}
        >
          <AdminEditableHeader
            as="span"
            value={col('status', 'สถานะจัดทำ')}
            scope={{
              kind: 'table-column',
              tableId: 'ha-v6-tracker',
              columnId: 'status',
              label: 'หัวคอลัมน์: สถานะจัดทำ',
            }}
          />
        </th>
      )}
    </tr>
  )
}

export type HaV6DocumentsTableProps = {
  pageKey: string
  sectionId: HaV6SectionId
  pageTitle: string
  pageDescription: string
  pageIcon: LucideIcon
  tableTitle: string
  tableDescription: string
  documents: HaV6TrackedDocument[]
  groupLabels?: Record<string, string>
}

export function HaV6DocumentsTable({
  pageKey,
  sectionId,
  pageTitle,
  pageDescription,
  pageIcon: PageIcon,
  tableTitle,
  tableDescription,
  documents,
  groupLabels,
}: HaV6DocumentsTableProps) {
  const { canManageOrgDocuments, isAdmin } = usePermissions()
  const canEdit = canManageOrgDocuments()
  const showAdminActions = isAdmin()
  const { colCount, minWidth } = useHaV6TableLayout(showAdminActions)
  const tableColSpan = colCount + (showAdminActions ? 1 : 0)
  const eyebrow = useUILabel('haV6.eyebrow', 'เอกสารมาตรฐาน HA ฉบับที่ 6')
  const { config } = useAppConfig()
  const mergedGroupLabels = useMergedGroupLabels(sectionId, groupLabels)
  const hasGroups = Object.keys(mergedGroupLabels).length > 0

  let lastGroup: string | undefined

  const resolveGroupLabel = (key: string, fallback: string) =>
    resolveUILabel(`haV6.group.${key}`, fallback, config.uiLabels)

  return (
    <div className="space-y-6">
      <AdminEditablePageHeader
        pageKey={pageKey}
        title={pageTitle}
        description={pageDescription}
        icon={PageIcon}
        eyebrow={eyebrow}
        showEditHint={false}
      />

      <SurfaceCard className="space-y-4 p-5">
        {tableDescription ? (
          <p className="text-sm text-muted-foreground">
            <AdminEditableText
              value={tableDescription}
              scope={{
                kind: 'page-text',
                pageKey,
                field: 'tableDescription',
                label: 'คำอธิบายใต้ตาราง',
              }}
            />
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <AdminEditModeHint />
          {showAdminActions && (
            <div className="flex flex-wrap items-center gap-2">
              <HaV6AddGroupButton sectionId={sectionId} />
              <HaV6AddDocumentButton
                sectionId={sectionId}
                documents={documents}
                groupLabels={mergedGroupLabels}
              />
            </div>
          )}
        </div>

        <WideTableScroll
          minWidthPx={minWidth}
          hint="เลื่อนขวาเพื่อดูคอลัมน์อื่น — ชื่อเอกสารและสถานะจะค้างให้อ่านได้"
        >
          <table className="w-full border-collapse text-sm" style={{ minWidth }}>
            <thead>
              <tr className="border-b border-sky-200/80 bg-sky-50/90">
                <th colSpan={tableColSpan} className="px-4 py-2.5 text-left text-sm font-semibold text-[#1e5a9e]">
                  <AdminEditableText
                    value={tableTitle}
                    scope={{
                      kind: 'page-text',
                      pageKey,
                      field: 'tableTitle',
                      label: 'หัวข้อตาราง',
                    }}
                  />
                </th>
              </tr>
              <HaV6TableHeaderRow showAdminActions={showAdminActions} />
            </thead>
            <tbody>
              {documents.map((doc) => {
                const rows = []
                const groupKey = doc.subSection
                if (hasGroups && groupKey && groupKey !== lastGroup) {
                  lastGroup = groupKey
                  const defaultLabel = mergedGroupLabels[groupKey]
                  if (defaultLabel) {
                    rows.push(
                      <GroupHeaderRow
                        key={`group-${groupKey}`}
                        groupKey={groupKey}
                        label={resolveGroupLabel(groupKey, defaultLabel)}
                        defaultLabel={defaultLabel}
                        colSpan={tableColSpan}
                      />
                    )
                  }
                }
                rows.push(
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    canEdit={canEdit}
                    showAdminActions={showAdminActions}
                    documents={documents}
                  />
                )
                return rows
              })}
            </tbody>
          </table>
        </WideTableScroll>
      </SurfaceCard>
    </div>
  )
}
