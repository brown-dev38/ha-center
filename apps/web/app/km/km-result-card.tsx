'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KM_RESULT_TYPE, kmSessionHref, type KmResultItem } from '@/app/km/km'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function KmResultCard({ item }: { item: KmResultItem }) {
  const typeInfo = KM_RESULT_TYPE[item.type] ?? KM_RESULT_TYPE.system

  return (
    <div className={cn(surfaceCardClass(), "p-4")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('border font-normal', typeInfo.className)}>
          {typeInfo.label}
        </Badge>
        {item.year && (
          <Badge variant="outline" className="font-normal">
            ปี {item.year}
          </Badge>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-foreground">{item.title}</h3>
      {item.description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      )}
      {item.session && (
        <Link
          href={kmSessionHref(item.session.id)}
          className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
        >
          จาก: {item.session.title}
        </Link>
      )}
      {item.systemUrl && (
        <a
          href={item.systemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          เปิดระบบ
          <ExternalLink className="size-3.5" />
        </a>
      )}
      <p className="mt-2 text-xs text-muted-foreground">โดย {item.author.name}</p>
    </div>
  )
}
