'use client'

import { CqiProjectCard } from '@/app/cqi/cqi-project-card'
import { useCQIOutstanding } from '@/hooks/use-cqi'
import { Trophy } from 'lucide-react'
import { EmptyState } from '@/app/empty-state'

export function CqiOutstandingShowcase() {
  const { data: groups, isLoading } = useCQIOutstanding()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">กำลังโหลดผลงานโดดเด่น...</p>
  }

  if (!groups?.length) {
    return (
      <EmptyState
        icon={Trophy}
        title="ยังไม่มีผลงานโดดเด่น"
        description="คัดเลือกโครงการ CQI ที่ได้รับรางวัลจะแสดงที่นี่"
      />
    )
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <div key={group.year ?? 'unknown'}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                ปี {group.year ?? '—'}
              </p>
              <h3 className="text-lg font-bold text-foreground">
                ผลงาน CQI โดดเด่น {group.projects.length} รายการ
              </h3>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.projects.map((p) => (
              <CqiProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
