'use client'

import Link from 'next/link'
import { ArrowRight, FileText, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { KM_SESSION_STATUS, kmSessionHref, type KmSessionItem } from '@/app/km/km'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function KmSessionCard({ session }: { session: KmSessionItem }) {
  const status = KM_SESSION_STATUS[session.status] ?? {
    label: session.status,
    className: 'border-border bg-muted text-muted-foreground',
  }

  return (
    <article className={cn(surfaceCardClass(undefined, true), "overflow-hidden")}>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border font-normal', status.className)}>
              {status.label}
            </Badge>
            {session.fiscalYear && (
              <Badge variant="outline" className="font-normal">
                ปี {session.fiscalYear}
              </Badge>
            )}
            {session.hasReport && (
              <Badge variant="outline" className="gap-1 border-primary/25 bg-primary/5 font-normal text-primary">
                <FileText className="size-3" />
                มีรายงาน PDF
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold leading-snug">
            <Link href={kmSessionHref(session.id)} className="text-foreground transition hover:text-primary">
              {session.title}
            </Link>
          </h3>
          {session.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{session.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {session.facilitator.name}
            </span>
            {session.department && <span>{session.department.name}</span>}
            <span>{session.resultsCount} ผลลัพธ์</span>
          </div>
          <Link
            href={kmSessionHref(session.id)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            ดูรายละเอียด
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <RecordTimestamp iso={session.sessionDate} label="published" variant="premium" className="lg:w-52" />
      </div>
    </article>
  )
}
