'use client'

import type { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { SurfaceCard } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

type ChartCardProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  height?: number
  className?: string
  bodyClassName?: string
  children: ReactNode
  /** true เมื่อไม่มีข้อมูลให้พล็อต */
  empty?: boolean
  emptyText?: string
}

export function ChartCard({
  title,
  description,
  icon: Icon,
  action,
  height = 260,
  className,
  bodyClassName,
  children,
  empty,
  emptyText = 'ยังไม่มีข้อมูลสำหรับแสดงกราฟ',
}: ChartCardProps) {
  return (
    <SurfaceCard className={cn('flex flex-col gap-4 p-5', className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
              <Icon className="size-4.5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>

      <div className={cn('w-full', bodyClassName)} style={{ height }}>
        {empty ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        )}
      </div>
    </SurfaceCard>
  )
}
