'use client'

import { Award, BookOpen, ClipboardList, GraduationCap } from 'lucide-react'
import { ELEARN_SYSTEM_MODULES } from '@/app/elearning/elearning'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

const ICONS = {
  book: BookOpen,
  progress: ClipboardList,
  quiz: ClipboardList,
  cert: Award,
} as const

export function ElearnOverviewPanel() {
  return (
    <section className="space-y-4">
      <div className="elearn-intro-inner rounded-2xl border border-primary/15 bg-gradient-to-br from-ha-purple-soft/80 via-white to-ha-green-soft/40 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/25">
            <GraduationCap className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">เส้นทางการเรียนรู้ HA</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              เรียนบทพื้นฐาน Hospital Accreditation ตามลำดับ → ทำแบบฝึกหัดบันทึกความคืบหน้า →
              สอบวัดผลเมื่อเรียนครบ → รับใบรับรองเมื่อผ่านเกณฑ์
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ELEARN_SYSTEM_MODULES.map((mod, i) => {
          const Icon = ICONS[mod.icon]
          return (
            <div key={mod.title} className={cn(surfaceCardClass(), "relative overflow-hidden p-4")}>
              <span className="absolute right-3 top-3 text-2xl font-bold text-primary/10">{i + 1}</span>
              <Icon className="size-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{mod.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mod.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
