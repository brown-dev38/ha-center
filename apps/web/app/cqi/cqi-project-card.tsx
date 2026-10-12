'use client'

import Link from 'next/link'
import { ArrowRight, Award, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CQI_STATUS, cqiDetailHref, type CqiListItem } from '@/app/cqi/cqi'
import { cn } from '@/app/common/utils'

export function CqiProjectCard({ project }: { project: CqiListItem }) {
  const status = CQI_STATUS[project.status] ?? {
    label: project.status,
    className: 'border-border bg-muted text-muted-foreground',
  }

  return (
    <Link
      href={cqiDetailHref(project.id)}
      className="group block h-full"
    >
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300',
          'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          project.isOutstanding && 'ring-1 ring-amber-200/60'
        )}
      >
        {project.isOutstanding && (
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-amber-200/40 to-transparent" />
        )}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border font-normal', status.className)}>
              {status.label}
            </Badge>
            {project.year && (
              <Badge variant="outline" className="font-normal tabular-nums">
                ปี {project.year}
              </Badge>
            )}
            {project.isOutstanding && (
              <Badge className="gap-1 border-amber-300/80 bg-gradient-to-r from-amber-100 to-amber-50 font-medium text-amber-900 hover:from-amber-100">
                <Award className="size-3" />
                ผลงานโดดเด่น
              </Badge>
            )}
          </div>
          {project.department && (
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary/80">
              {project.department.name}
            </p>
          )}
          <h3 className="mt-1 flex-1 text-lg font-bold leading-snug text-foreground transition group-hover:text-primary">
            {project.title}
          </h3>
          {project.awardName && (
            <p className="mt-2 text-sm font-medium text-amber-800">{project.awardName}</p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="size-3.5" />
              {project.owner.name}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-80 transition group-hover:gap-2 group-hover:opacity-100">
              ดูรายละเอียด
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
