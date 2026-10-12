'use client'

import { useState } from 'react'
import { Inbox, Mail, Phone, AlertTriangle } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { ListSkeleton } from '@/app/loading-skeletons'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { Button } from '@/components/ui/button'
import {
  type ConsultRequest,
  useConsultRequests,
  useUpdateConsultRequest,
} from '@/hooks/use-consult-requests'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

const STATUS_TABS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'new', label: 'ใหม่' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'done', label: 'เสร็จสิ้น' },
  { value: 'archived', label: 'เก็บถาวร' },
]

const STATUS_META: Record<string, { label: string; className: string }> = {
  new: { label: 'ใหม่', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  in_progress: { label: 'กำลังดำเนินการ', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  done: { label: 'เสร็จสิ้น', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'เก็บถาวร', className: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const NEXT_ACTIONS: { from: string; to: string; label: string }[] = [
  { from: 'new', to: 'in_progress', label: 'รับเรื่อง' },
  { from: 'in_progress', to: 'done', label: 'ทำเสร็จ' },
  { from: 'done', to: 'archived', label: 'เก็บถาวร' },
]

function RequestCard({ req }: { req: ConsultRequest }) {
  const update = useUpdateConsultRequest()
  const meta = STATUS_META[req.status] ?? STATUS_META.new
  const next = NEXT_ACTIONS.find((a) => a.from === req.status)

  const move = async (to: string) => {
    try {
      await update.mutateAsync({ id: req.id, status: to })
      showSuccessToast('อัปเดตสถานะแล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    }
  }

  return (
    <div className={cn(surfaceCardClass(), "space-y-3 p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{req.topic}</h3>
            {req.urgent && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                <AlertTriangle className="size-3" />
                เร่งด่วน
              </span>
            )}
            <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.className)}>
              {meta.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {req.name} · {req.department}
          </p>
        </div>
        <RecordTimestamp iso={req.createdAt} label="received" variant="inline" showRelative />
      </div>

      <p className="whitespace-pre-wrap rounded-lg bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground">
        {req.message}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <a href={`mailto:${req.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
          <Mail className="size-3.5" />
          {req.email}
        </a>
        {req.phone && (
          <a href={`tel:${req.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <Phone className="size-3.5" />
            {req.phone}
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
        {next && (
          <Button type="button" size="sm" onClick={() => move(next.to)} disabled={update.isPending}>
            {next.label}
          </Button>
        )}
        {req.status !== 'archived' && req.status !== 'new' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => move('new')}
            disabled={update.isPending}
          >
            กลับเป็นใหม่
          </Button>
        )}
      </div>
    </div>
  )
}

export function ConsultRequestsView() {
  const [status, setStatus] = useState('')
  const { data, isLoading, isError } = useConsultRequests(status || undefined)
  const requests = data?.requests ?? []
  const summary = data?.summary ?? {}

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="admin-consult"
        title="คำขอปรึกษา (ศูนย์ HA)"
        description="คำขอปรึกษาที่ส่งผ่านหน้าติดต่อ — ติดตามและอัปเดตสถานะ"
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-border p-1">
        {STATUS_TABS.map((t) => {
          const count = t.value ? summary[t.value] : Object.values(summary).reduce((a, b) => a + b, 0)
          return (
            <Button
              key={t.value || 'all'}
              type="button"
              size="sm"
              variant={status === t.value ? 'default' : 'ghost'}
              className="gap-1.5 rounded-lg"
              onClick={() => setStatus(t.value)}
            >
              {t.label}
              {count ? (
                <span className="rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums">{count}</span>
              ) : null}
            </Button>
          )
        })}
      </div>

      {isLoading && <ListSkeleton rows={4} />}

      {isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          โหลดคำขอไม่สำเร็จ
        </p>
      )}

      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState icon={Inbox} title="ยังไม่มีคำขอปรึกษา" description="คำขอที่ส่งผ่านหน้าติดต่อจะแสดงที่นี่" />
      )}

      {!isLoading && requests.length > 0 && (
        <div className="grid gap-4">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  )
}
