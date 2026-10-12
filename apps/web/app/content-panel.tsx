import type { ReactNode } from 'react'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

type ContentPanelProps = {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function ContentPanel({
  title,
  action,
  children,
  className,
  noPadding,
}: ContentPanelProps) {
  return (
    <SurfaceCard className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="relative flex items-center justify-between gap-3 border-b border-border/70 bg-gradient-to-r from-primary/[0.03] via-card to-secondary/[0.03] px-5 py-3.5">
          {title && (
            <h2 className="flex items-center gap-2 font-heading text-[0.95rem] font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className={cn(!noPadding && 'bg-card p-5')}>{children}</div>
    </SurfaceCard>
  )
}
