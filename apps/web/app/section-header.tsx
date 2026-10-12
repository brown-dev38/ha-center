import type { ReactNode } from 'react'
import { SectionDesc, SectionLabel, SectionTitle } from '@/app/common/ui/section-label'
import { cn } from '@/app/common/utils'

type SectionHeaderProps = {
  label?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  label,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {label && <SectionLabel>{label}</SectionLabel>}
        <SectionTitle>{title}</SectionTitle>
        {description && <SectionDesc>{description}</SectionDesc>}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  )
}
