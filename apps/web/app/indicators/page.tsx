'use client'

import { BarChart3, ExternalLink } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { KPI_PORTAL_URL } from '@/app/common/navigation'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

export default function IndicatorsPage() {
  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="indicators"
        title="ตัวชี้วัด"
        description="ระบบตัวชี้วัด KPI โรงพยาบาลมหาวิทยาลัยพะเยา — เปิดในแท็บใหม่"
      />

      <a
        href={KPI_PORTAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(surfaceCardClass(undefined, true), "group flex max-w-xl flex-col overflow-hidden ring-2 ring-primary/25")}
      >
        <div className="flex items-start gap-4 border-b border-border/60 bg-gradient-to-r from-primary/[0.06] to-ha-green/[0.04] p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <BarChart3 className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              ระบบ KPI
            </span>
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
              เปิดระบบตัวชี้วัด KPI
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{KPI_PORTAL_URL}</p>
          </div>
          <ExternalLink className="size-5 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
        </div>
        <p className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          คลิกเพื่อเข้าสู่ระบบตัวชี้วัดบน UPH Services — ติดตามและรายงาน KPI ของโรงพยาบาล
        </p>

      </a>
    </div>
  )
}
