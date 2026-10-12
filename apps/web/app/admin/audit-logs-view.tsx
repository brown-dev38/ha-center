'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Search, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { AuditLogTable } from '@/app/admin/audit-log-table'
import { AuditLogStats } from '@/app/admin/audit-log-stats'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

const ENTITY_OPTIONS = [
  { value: '', label: 'ทุก entity' },
  { value: 'auth', label: 'auth' },
  { value: 'user', label: 'user' },
  { value: 'document', label: 'document' },
  { value: 'meeting', label: 'meeting' },
  { value: 'meeting_agenda', label: 'meeting_agenda' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'ทุกกิจกรรม' },
  { value: 'LOGIN', label: 'Login (ทั้งหมด)' },
  { value: 'LOGIN_SUCCESS', label: 'Login สำเร็จ' },
  { value: 'LOGIN_FAILED', label: 'Login ล้มเหลว' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATE', label: 'สร้าง' },
  { value: 'UPDATE', label: 'แก้ไข' },
  { value: 'DELETE', label: 'ลบ' },
]

export function AuditLogsView() {
  const [page, setPage] = useState(1)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading, isFetching, refetch } = useAuditLogs({
    page,
    limit: 30,
    entity: entity || undefined,
    action: action || undefined,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
  })

  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  const handleReset = () => {
    setEntity('')
    setAction('')
    setSearch('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="admin-audit"
        title="Audit Logs"
        description="ติดตามทุกการกระทำของผู้ใช้ในระบบ HA — ค้นหา/กรอง/ดูรายละเอียด JSON"
        variant="hero"
        eyebrow="ระบบบันทึก"
        icon={ShieldAlert}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RotateCw className={cn('size-4', isFetching && 'animate-spin')} />
          รีเฟรช
        </Button>
      </AdminEditablePageHeader>

      <AuditLogStats days={7} />

      {/* Filters */}
      <div className={cn(surfaceCardClass(), "p-4")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Label htmlFor="audit-search" className="text-xs">
              ค้นหา (action / entity ID)
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="audit-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="พิมพ์ keyword..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Entity</Label>
            <select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value)
                setPage(1)
              }}
              className="mt-1 flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm"
            >
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">Action</Label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value)
                setPage(1)
              }}
              className="mt-1 flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="audit-from" className="text-xs">
              ตั้งแต่
            </Label>
            <Input
              id="audit-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="audit-to" className="text-xs">
              ถึง
            </Label>
            <Input
              id="audit-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="tabular-nums">
            พบ <span className="font-semibold text-foreground">{total}</span> รายการ
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="font-medium text-primary transition hover:underline"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      <AuditLogTable logs={data?.data ?? []} loading={isLoading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <span className="text-xs text-muted-foreground tabular-nums">
            หน้า <span className="font-semibold text-foreground">{page}</span> / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              ก่อนหน้า
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="gap-1"
            >
              ถัดไป
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
