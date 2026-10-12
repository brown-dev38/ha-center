'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FaqItem } from '@/app/contact/contact'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

type Props = {
  items: FaqItem[]
}

export function ContactFaq({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const open = openId === item.id
        return (
          <div
            key={item.id}
            className={cn(
              cn(surfaceCardClass(), 'overflow-hidden transition-shadow duration-200'),
              open && 'ring-1 ring-primary/15'
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/30"
              aria-expanded={open}
            >
              <span className="font-medium text-foreground">{item.question}</span>
              <ChevronDown
                className={cn(
                  'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180 text-primary'
                )}
              />
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <p className="border-t border-border/60 px-5 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
