'use client'

import { Medal, Sparkles, Trophy } from 'lucide-react'
import { formatDateThai } from '@/app/common/datetime'
import type { CqiDetail } from '@/app/cqi/cqi'

export function CqiAwardsPanel({ project }: { project: CqiDetail }) {
  const hasOutstanding = project.isOutstanding || project.awards.length > 0 || project.awardName

  if (!hasOutstanding) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-8 text-center">
        <Medal className="mx-auto size-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">ยังไม่มีการบันทึกผลงานโดดเด่นหรือรางวัล</p>
      </div>
    )
  }

  return (
    <div className="cqi-awards-panel overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 shadow-sm">
      <div className="flex items-center gap-3 border-b border-amber-200/50 bg-gradient-to-r from-amber-100/80 to-amber-50/50 px-6 py-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30">
          <Trophy className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
            ผลงานโดดเด่น
          </p>
          <h3 className="text-lg font-bold text-amber-950">ได้รับรางวัล / คัดเลือกพิเศษ</h3>
        </div>
        <Sparkles className="ml-auto size-5 text-amber-500/70" />
      </div>
      <div className="space-y-4 p-6">
        {project.awardName && (
          <div className="rounded-xl border border-amber-200/60 bg-white/80 px-4 py-3">
            <p className="text-xs font-medium text-amber-800">ชื่อรางวัลหลัก</p>
            <p className="mt-1 text-base font-semibold text-foreground">{project.awardName}</p>
          </div>
        )}
        {project.awards.map((award) => (
          <div
            key={award.id}
            className="flex gap-4 rounded-xl border border-amber-100 bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Medal className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{award.awardName}</p>
              {award.awardLevel && (
                <p className="text-sm text-amber-800">ระดับ: {award.awardLevel}</p>
              )}
              {award.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{award.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateThai(award.awardedAt)}
              </p>
            </div>
          </div>
        ))}
        {project.isOutstanding && project.awards.length === 0 && !project.awardName && (
          <p className="text-sm text-amber-900">
            โครงการนี้ถูกคัดเลือกเป็นผลงาน CQI โดดเด่นของหน่วยงาน
          </p>
        )}
      </div>
    </div>
  )
}
