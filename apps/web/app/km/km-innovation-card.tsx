'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { kmSessionHref, type KmInnovationItem } from '@/app/km/km'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

export function KmInnovationCard({ item }: { item: KmInnovationItem }) {
  return (
    <div className={cn(surfaceCardClass(), "p-4")}>
      <div className="flex flex-wrap items-center gap-2">
        {item.innovationType && (
          <Badge variant="outline" className="border-teal-200 bg-teal-50 font-normal text-teal-800">
            {item.innovationType}
          </Badge>
        )}
        <Badge variant="outline" className="font-normal">
          {item.status === 'published' ? 'เผยแพร่' : 'ร่าง'}
        </Badge>
      </div>
      <h3 className="mt-2 font-semibold text-foreground">{item.title}</h3>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
      {item.result && (
        <p className="mt-2 text-sm">
          <span className="font-medium text-foreground">ผลที่ได้: </span>
          {item.result}
        </p>
      )}
      {item.session && (
        <Link href={kmSessionHref(item.session.id)} className="mt-2 inline-block text-xs font-medium text-primary">
          จาก Session: {item.session.title}
        </Link>
      )}
      <p className="mt-2 text-xs text-muted-foreground">โดย {item.author.name}</p>
    </div>
  )
}
