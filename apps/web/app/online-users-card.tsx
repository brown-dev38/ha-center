'use client'

import { Users } from 'lucide-react'
import { useOnlineUsers } from '@/hooks/use-presence'
import { cn } from '@/app/common/utils'

function getInitial(name: string): string {
  return (name?.trim().charAt(0) || 'U').toUpperCase()
}

export function OnlineUsersCard({ className }: { className?: string }) {
  const { data } = useOnlineUsers()
  const users = data?.users ?? []
  const count = data?.count ?? 0
  const maxShown = 5
  const shown = users.slice(0, maxShown)
  const more = Math.max(0, count - shown.length)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-emerald-50/80 via-white to-primary/[0.04] p-3 shadow-sm',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-emerald-200/30 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 text-emerald-700">
          <Users className="size-3.5" />
        </span>
        <p className="flex-1 text-xs font-semibold text-foreground">
          ออนไลน์ตอนนี้
        </p>
        <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {count}
        </span>
      </div>

      {count === 0 ? (
        <p className="relative mt-2 text-[11px] text-muted-foreground">
          ยังไม่มีผู้ใช้ออนไลน์
        </p>
      ) : (
        <div className="relative mt-2.5 space-y-1.5">
          {shown.map((u) => (
            <div
              key={u.userId}
              className="group flex items-center gap-2 rounded-md px-1 py-1 transition hover:bg-white/80"
              title={`${u.name} · ${u.roleLabel ?? u.role ?? ''}${u.departmentName ? ` · ${u.departmentName}` : ''}`}
            >
              <div className="relative size-6 shrink-0">
                <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-[var(--ha-green)] text-[10px] font-bold text-white shadow-sm">
                  {getInitial(u.name)}
                </div>
                <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-medium leading-tight text-foreground">
                  {u.name}
                </p>
                {(u.roleLabel || u.role) && (
                  <p className="truncate text-[10px] leading-tight text-muted-foreground">
                    {u.roleLabel ?? u.role}
                  </p>
                )}
              </div>
            </div>
          ))}

          {more > 0 && (
            <p className="px-1 text-[10px] font-medium text-muted-foreground">
              และอีก {more} คน
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Badge เล็กสำหรับวางใน top bar — แสดงจำนวนคน online */
export function OnlineUsersBadge({ className }: { className?: string }) {
  const { data } = useOnlineUsers()
  const count = data?.count ?? 0
  if (count === 0) return null

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm',
        className
      )}
      title={`มีผู้ใช้ออนไลน์ ${count} คน`}
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <span className="tabular-nums">{count}</span>
      <span className="hidden sm:inline">ออนไลน์</span>
    </div>
  )
}
