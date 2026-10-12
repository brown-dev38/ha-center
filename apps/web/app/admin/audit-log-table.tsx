'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Globe, Server } from 'lucide-react'
import type { AuditLogItem } from '@/app/admin/audit-log-api'
import {
  formatAuditTime,
  formatRelative,
  getAuditActionMeta,
} from '@/app/admin/audit-log-helpers'
import { cn } from '@/app/common/utils'

function getInitial(name: string | null | undefined): string {
  return (name?.trim().charAt(0) || '?').toUpperCase()
}

function JsonView({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <span className="text-xs italic text-muted-foreground">— ไม่มีข้อมูล —</span>
  }
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/80 scrollbar-thin">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function AuditRow({ log }: { log: AuditLogItem }) {
  const [open, setOpen] = useState(false)
  const meta = getAuditActionMeta(log.action)
  const Icon = meta.icon
  const hasDetail = !!log.oldData || !!log.newData || !!log.userAgent

  return (
    <>
      <tr
        className={cn(
          'border-b border-border/70 transition hover:bg-muted/30',
          open && 'bg-primary/[0.03]'
        )}
      >
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tabular-nums text-foreground">
              {formatAuditTime(log.createdAt)}
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              {formatRelative(log.createdAt)}
            </span>
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          {log.user ? (
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-[var(--ha-green)] text-[11px] font-bold text-white shadow-sm">
                {getInitial(log.user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {log.user.name}
                </p>
                <p className="truncate text-[10.5px] text-muted-foreground">
                  {log.user.role ?? log.user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Server className="size-3.5" /> ระบบ
            </div>
          )}
        </td>

        <td className="px-4 py-3 align-top">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold',
              meta.chip
            )}
          >
            <Icon className="size-3" />
            {meta.label}
          </span>
        </td>

        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">{log.entity}</span>
            {log.entityId && (
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {log.entityId.length > 16 ? `${log.entityId.slice(0, 16)}…` : log.entityId}
              </span>
            )}
          </div>
        </td>

        <td className="px-4 py-3 align-top">
          {log.ipAddress ? (
            <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
              <Globe className="size-3" /> {log.ipAddress}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          )}
        </td>

        <td className="px-4 py-3 text-right align-top">
          {hasDetail && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary/30 hover:text-primary"
            >
              {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {open ? 'ซ่อน' : 'ดู'}
            </button>
          )}
        </td>
      </tr>

      {open && (
        <tr className="border-b border-border/70 bg-muted/20">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  ก่อน (old data)
                </p>
                <JsonView data={log.oldData} />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  หลัง (new data)
                </p>
                <JsonView data={log.newData} />
              </div>
            </div>
            {log.userAgent && (
              <p className="mt-3 font-mono text-[10.5px] text-muted-foreground">
                <span className="font-semibold text-foreground/70">UA:</span> {log.userAgent}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditLogTable({
  logs,
  loading,
}: {
  logs: AuditLogItem[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-3">กำลังโหลด...</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        ไม่มี audit log ที่ตรงเงื่อนไข
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">เวลา</th>
              <th className="px-4 py-3">ผู้ใช้</th>
              <th className="px-4 py-3">กิจกรรม</th>
              <th className="px-4 py-3">เป้าหมาย</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3 text-right">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <AuditRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
