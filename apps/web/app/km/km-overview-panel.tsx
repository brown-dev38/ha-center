'use client'

import { Cpu, FileText, Lightbulb, Sparkles, Users } from 'lucide-react'
import { KM_SYSTEM_MODULES } from '@/app/km/km'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

const ICONS = {
  meeting: Users,
  result: Sparkles,
  system: Cpu,
  innovation: Lightbulb,
} as const

export function KmOverviewPanel() {
  return (
    <section className="space-y-4">
      <div className={cn(surfaceCardClass(), "border-primary/15 bg-gradient-to-br from-primary/[0.04] to-ha-green/[0.03] p-5")}>
        <h2 className="text-lg font-semibold text-foreground">โครงสร้างระบบ KM ศูนย์ HA</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Knowledge Management (KM) เชื่อมโยง<strong className="font-medium text-foreground"> การประชุม → ความรู้ → ผลลัพธ์ → นวัตกรรม</strong>
          ทุกครั้งที่จัดประชุม KM บันทึกเป็น Session พร้อมรายงาน PDF จากนั้นสรุปผลลัพธ์ ระบบที่พัฒนา และนวัตกรรมที่เกิดขึ้น
          เพื่อให้ทีมคุณภาพค้นหาและนำกลับมาใช้ได้
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {KM_SYSTEM_MODULES.map((mod) => {
          const Icon = ICONS[mod.icon]
          return (
            <div key={mod.id} className={cn(surfaceCardClass(), "p-4")}>
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground">{mod.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{mod.description}</p>
            </div>
          )
        })}
      </div>

      <div className={cn(surfaceCardClass(), "p-4")}>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">ลำดับการใช้งานแนะนำ</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>สร้าง <span className="text-foreground">KM Session</span> หลังการประชุม (อัปโหลด PDF รายงานได้)</li>
              <li>บันทึก <span className="text-foreground">ผลลัพธ์</span> — ระบบที่พัฒนา หรือลิงก์ที่เกี่ยวข้อง</li>
              <li>บันทึก <span className="text-foreground">นวัตกรรม</span> — กระบวนการ/บริการ/เทคโนโลยี พร้อมผลที่ได้</li>
              <li>ค้นหาย้อนหลังตามปีงบประมาณ หมวด หรือ Session</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
