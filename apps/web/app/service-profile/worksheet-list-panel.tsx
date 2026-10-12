'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Pencil,
  RotateCcw,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { WideTableScroll } from '@/app/common/ui/wide-table-scroll'
import { MineBadge } from '@/app/common/mine-badge'
import { useWorksheets, useSetWorksheetHidden } from '@/hooks/use-worksheets'
import { usePermissions } from '@/hooks/use-permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { alertNoWorksheetEditPermission } from '@/app/service-profile/worksheet-access'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft: { label: 'แบบร่าง', className: 'bg-amber-100 text-amber-900' },
  submitted: { label: 'ส่งแล้ว', className: 'bg-emerald-100 text-emerald-900' },
  archived: { label: 'เก็บถาวร', className: 'bg-muted text-muted-foreground' },
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'draft', label: 'แบบร่าง' },
  { value: 'submitted', label: 'ส่งแล้ว' },
  { value: 'archived', label: 'เก็บถาวร' },
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updated-desc', label: 'อัปเดตล่าสุด' },
  { value: 'updated-asc', label: 'อัปเดตเก่าสุด' },
  { value: 'year-desc', label: 'ปีล่าสุด' },
  { value: 'year-asc', label: 'ปีเก่าสุด' },
  { value: 'title-asc', label: 'ชื่อ ก–ฮ' },
]

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 'all' as const, label: 'ทั้งหมด' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
}

function ListSkeleton() {
  return (
    <div className={cn(surfaceCardClass(), 'space-y-3 p-4')}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="ml-auto h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

export function WorksheetListPanel({
  onCreateNewAction,
  onEditAction,
}: {
  onCreateNewAction?: () => void
  onEditAction?: (id: string) => void
}) {
  const router = useRouter()
  const { canDeleteDocuments, roleLabel, role } = usePermissions()
  const isAdmin = canDeleteDocuments()
  const [includeHidden, setIncludeHidden] = useState(false)
  const [hideTarget, setHideTarget] = useState<{ id: string; title: string } | null>(null)
  const { data, isLoading, isError, error } = useWorksheets({ includeHidden: isAdmin && includeHidden })
  const hideMutation = useSetWorksheetHidden()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated-desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number | 'all'>(10)

  const items = useMemo(() => data ?? [], [data])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, yearFilter, sortBy, pageSize, includeHidden])

  const stats = useMemo(
    () => ({
      total: items.length,
      draft: items.filter((i) => i.status === 'draft').length,
      submitted: items.filter((i) => i.status === 'submitted').length,
      archived: items.filter((i) => i.status === 'archived').length,
    }),
    [items]
  )

  const years = useMemo(() => {
    const set = new Set(items.map((i) => i.year))
    return Array.from(set).sort((a, b) => b - a)
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (yearFilter !== 'all' && String(item.year) !== yearFilter) return false
      if (q) {
        const haystack = `${item.id} ${item.title} ${item.departmentName} ${item.preparedByName}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    const sorted = [...result]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'updated-asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        case 'year-desc':
          return b.year - a.year
        case 'year-asc':
          return a.year - b.year
        case 'title-asc':
          return a.title.localeCompare(b.title, 'th')
        case 'updated-desc':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
    return sorted
  }, [items, query, statusFilter, yearFilter, sortBy])

  const totalPages =
    pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginated = useMemo(() => {
    if (pageSize === 'all') return filtered
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const rangeStart = filtered.length === 0 ? 0 : pageSize === 'all' ? 1 : (page - 1) * pageSize + 1
  const rangeEnd =
    pageSize === 'all' ? filtered.length : Math.min(page * (pageSize as number), filtered.length)

  const handleEdit = (id: string, canEdit: boolean) => {
    if (!canEdit) {
      alertNoWorksheetEditPermission()
      return
    }
    if (onEditAction) {
      onEditAction(id)
      return
    }
    router.push(`/dashboard/service-profile?tab=worksheet&id=${encodeURIComponent(id)}`)
  }

  const handleSetHidden = async (id: string, hidden: boolean) => {
    try {
      await hideMutation.mutateAsync({ id, hidden })
      showSuccessToast(hidden ? 'ซ่อนเอกสารแล้ว' : 'แสดงเอกสารอีกครั้งแล้ว')
      setHideTarget(null)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <ListSkeleton />
      </div>
    )
  }

  if (isError) {
    const detail = error instanceof Error ? error.message : null
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        <p className="font-medium">โหลดรายการเอกสารไม่สำเร็จ</p>
        <p className="mt-1 text-destructive/90">{detail ?? 'ตรวจสอบการเชื่อมต่อฐานข้อมูล'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-white to-ha-green/[0.04] p-5 shadow-sm lg:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground lg:text-xl">
                เอกสารทั้งหมด
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Unit Profile Worksheet จากทุกหน่วยงาน — ค้นหา กรอง และดูแบบตาราง
              </p>
            </div>
          </div>
          {onCreateNewAction && (
            <Button type="button" onClick={onCreateNewAction} className="shrink-0 shadow-sm">
              <FilePlus2 className="size-4" />
              สร้างเอกสารใหม่
            </Button>
          )}
        </div>

        {items.length > 0 && (
          <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'ทั้งหมด', value: stats.total, accent: 'text-primary', bg: 'bg-primary/5' },
              { label: 'แบบร่าง', value: stats.draft, accent: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'ส่งแล้ว', value: stats.submitted, accent: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'เก็บถาวร', value: stats.archived, accent: 'text-muted-foreground', bg: 'bg-muted/50' },
            ].map((s) => (
              <div
                key={s.label}
                className={cn('rounded-xl border border-border/50 px-4 py-3 backdrop-blur-sm', s.bg)}
              >
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className={cn('mt-0.5 text-2xl font-bold tabular-nums', s.accent)}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-primary"
            checked={includeHidden}
            onChange={(e) => setIncludeHidden(e.target.checked)}
          />
          <EyeOff className="size-4 text-muted-foreground" aria-hidden />
          แสดงเอกสารที่ซ่อนอยู่
        </label>
      )}

      {role && isAdmin && (
        <p className="text-xs text-muted-foreground">
          บทบาท: {roleLabel} — ซ่อนเอกสารได้เฉพาะแอดมิน
        </p>
      )}

      {/* Search + filter + sort toolbar */}
      <div className={cn(surfaceCardClass(), 'flex flex-col gap-3 p-3 lg:flex-row lg:items-center')}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาหัวข้อ / หน่วยงาน / ผู้จัดทำ"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-0.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                  statusFilter === s.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm shadow-sm outline-none focus-visible:border-primary"
          >
            <option value="all">ทุกปี</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm shadow-sm outline-none focus-visible:border-primary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">แสดงต่อหน้า</span>
            <div className="inline-flex rounded-lg border border-border/80 bg-background p-0.5 shadow-sm">
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setPageSize(opt.value)}
                  className={cn(
                    'min-w-[2.25rem] rounded-md px-2 py-1 text-xs font-medium transition',
                    pageSize === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={cn(surfaceCardClass(), 'p-8 text-center')}>
          <p className="text-sm text-muted-foreground">ยังไม่มีเอกสารที่บันทึกไว้</p>
          {onCreateNewAction && (
            <Button type="button" className="mt-4" onClick={onCreateNewAction}>
              <FilePlus2 className="size-4" />
              เริ่มกรอกเอกสารใหม่
            </Button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn(surfaceCardClass(), 'p-8 text-center')}>
          <p className="text-sm text-muted-foreground">ไม่พบเอกสารที่ตรงกับเงื่อนไข</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery('')
              setStatusFilter('all')
              setYearFilter('all')
            }}
          >
            ล้างตัวกรอง
          </Button>
        </div>
      ) : (
        <>
          <div className={cn(surfaceCardClass(), 'overflow-hidden')}>
            <WideTableScroll minWidthPx={960} hint="เลื่อนขวาเพื่อดูคอลัมน์อื่น — หัวข้อและจัดการจะค้างให้อ่านได้">
              <table className="w-full border-collapse text-sm" style={{ minWidth: 960 }}>
                <thead>
                  <tr className="border-b border-border/60 bg-gradient-to-r from-slate-50 to-primary/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="w-12 px-3 py-3.5 text-center">#</th>
                    <th className="sticky left-0 z-20 min-w-[7rem] bg-slate-50 px-4 py-3.5 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]">
                      เลขที่เอกสาร
                    </th>
                    <th className="sticky left-[7rem] z-20 min-w-[14rem] bg-slate-50 px-4 py-3.5 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]">
                      หัวข้อ / หน่วยงาน
                    </th>
                    <th className="w-16 px-4 py-3.5 text-center">ปี</th>
                    <th className="sticky right-[12rem] z-20 w-24 bg-slate-50 px-4 py-3.5 shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.08)]">
                      สถานะ
                    </th>
                    <th className="min-w-[8rem] px-4 py-3.5">ผู้จัดทำ</th>
                    <th className="w-28 px-4 py-3.5">อัปเดต</th>
                    <th className="w-16 px-4 py-3.5 text-center">เวอร์ชัน</th>
                    <th className="sticky right-0 z-20 min-w-[12rem] bg-slate-50 px-4 py-3.5 text-right shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.08)]">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item, idx) => {
                    const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.draft
                    const rowNum = pageSize === 'all' ? idx + 1 : (page - 1) * (pageSize as number) + idx + 1
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'group border-b border-border/40 transition-colors hover:bg-primary/[0.02]',
                          item.isHidden && 'bg-muted/30 opacity-80'
                        )}
                      >
                        <td className="px-3 py-3.5 text-center text-xs tabular-nums text-muted-foreground">
                          {rowNum}
                        </td>
                        <td className="sticky left-0 z-10 bg-background px-4 py-3.5 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-primary/[0.02]">
                          <p className="font-mono text-xs font-semibold text-primary">{item.id}</p>
                        </td>
                        <td className="sticky left-[7rem] z-10 min-w-[14rem] bg-background px-4 py-3.5 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-primary/[0.02]">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium leading-snug text-foreground">{item.title}</p>
                            {item.isMine && <MineBadge />}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.departmentName}</p>
                          {item.isHidden && (
                            <Badge variant="secondary" className="mt-1.5 text-[10px] font-normal">
                              ซ่อนอยู่
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center tabular-nums font-medium">{item.year}</td>
                        <td className="sticky right-[12rem] z-10 bg-background px-4 py-3.5 shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-primary/[0.02]">
                          <Badge className={cn('font-medium', status.className)}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-foreground/90">{item.preparedByName}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground tabular-nums">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td className="px-4 py-3.5 text-center tabular-nums text-muted-foreground">
                          {item.latestVersionNo ? `v${item.latestVersionNo}` : '—'}
                        </td>
                        <td className="sticky right-0 z-10 bg-background px-4 py-3.5 shadow-[-2px_0_6px_-2px_rgba(15,23,42,0.08)] group-hover:bg-primary/[0.02]">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {item.status === 'draft' ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 px-2.5"
                                onClick={() => handleEdit(item.id, item.canEdit)}
                              >
                                <Pencil className="size-3.5" />
                                แก้ไข
                              </Button>
                            ) : null}
                            <Link
                              href={`/dashboard/service-profile?tab=worksheet&duplicate=${item.id}`}
                              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'h-8 gap-1 px-2.5' })}
                              title="ทำสำเนาเป็นเอกสารใหม่"
                            >
                              <Copy className="size-3.5" />
                              สำเนา
                            </Link>
                            <Link
                              href={`/dashboard/service-profile/preview?id=${item.id}`}
                              className={buttonVariants({
                                variant: item.status === 'draft' ? 'ghost' : 'outline',
                                size: 'sm',
                                className: 'h-8 gap-1 px-2.5',
                              })}
                            >
                              <Eye className="size-3.5" />
                              ดู
                            </Link>
                            {isAdmin && !item.isHidden && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 px-2.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
                                onClick={() => setHideTarget({ id: item.id, title: item.title })}
                              >
                                <EyeOff className="size-3.5" />
                              </Button>
                            )}
                            {isAdmin && item.isHidden && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 px-2.5"
                                disabled={hideMutation.isPending}
                                onClick={() => void handleSetHidden(item.id, false)}
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </WideTableScroll>

            {/* Pagination footer */}
            <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                แสดง{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                จาก <span className="font-semibold tabular-nums text-foreground">{filtered.length}</span>{' '}
                รายการ
                {filtered.length !== items.length && (
                  <span className="text-muted-foreground/80"> (กรองจาก {items.length} ทั้งหมด)</span>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                      title="หน้าแรก"
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      ก่อนหน้า
                    </Button>
                    <span className="min-w-[4.5rem] px-2 text-center text-xs font-medium tabular-nums text-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      ถัดไป
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage(totalPages)}
                      title="หน้าสุดท้าย"
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!hideTarget} onOpenChange={(open) => !open && setHideTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการซ่อนเอกสาร</DialogTitle>
            <DialogDescription>
              จะซ่อน &quot;{hideTarget?.title}&quot; จากรายการ — ผู้ใช้ทั่วไปจะไม่เห็นเอกสารนี้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHideTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={hideMutation.isPending}
              onClick={() => hideTarget && void handleSetHidden(hideTarget.id, true)}
            >
              {hideMutation.isPending ? 'กำลังซ่อน...' : 'ซ่อนเอกสาร'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
