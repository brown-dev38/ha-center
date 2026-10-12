'use client'

import { Activity, BarChart3, Trophy, Users } from 'lucide-react'
import { useAuditLogStats } from '@/hooks/use-audit-logs'
import { StatCard } from '@/app/stat-card'
import { cn } from '@/app/common/utils'

export function AuditLogStats({ days = 7 }: { days?: number }) {
  const { data, isLoading } = useAuditLogStats(days)
  const max = Math.max(1, ...(data?.byDay.map((d) => d.count) ?? [1]))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`เหตุการณ์ ${days} วัน`}
          value={data?.total ?? 0}
          loading={isLoading}
          icon={Activity}
          variant="primary"
        />
        <StatCard
          label="กิจกรรมสูงสุด"
          value={data?.byAction[0]?.action ?? '—'}
          loading={isLoading}
          icon={BarChart3}
          variant="success"
          hint={data?.byAction[0] ? `${data.byAction[0].count} ครั้ง` : undefined}
        />
        <StatCard
          label="Entity ยอดนิยม"
          value={data?.byEntity[0]?.entity ?? '—'}
          loading={isLoading}
          icon={Trophy}
          variant="warning"
          hint={data?.byEntity[0] ? `${data.byEntity[0].count} รายการ` : undefined}
        />
        <StatCard
          label="ผู้ใช้แอคทีฟสูงสุด"
          value={data?.topUsers[0]?.name ?? '—'}
          loading={isLoading}
          icon={Users}
          variant="neutral"
          hint={data?.topUsers[0] ? `${data.topUsers[0].count} ครั้ง` : undefined}
        />
      </div>

      {/* Activity bar chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          กิจกรรมรายวัน ({days} วันย้อนหลัง)
        </p>
        <div className="mt-4 flex items-end justify-between gap-1.5">
          {(data?.byDay ?? [])
            .slice()
            .reverse()
            .map((d) => {
              const pct = Math.max(4, (d.count / max) * 100)
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-full rounded-t-md bg-gradient-to-t from-primary/80 to-secondary/60 transition-all',
                      'shadow-sm hover:from-primary hover:to-secondary'
                    )}
                    style={{ height: `${pct}px`, minHeight: '4px' }}
                    title={`${d.day}: ${d.count} ครั้ง`}
                  />
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {d.day.slice(5)}
                  </span>
                </div>
              )
            })}
          {(!data?.byDay || data.byDay.length === 0) && (
            <p className="flex-1 py-6 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูล
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
