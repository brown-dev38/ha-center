import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { PageHeaderBanner } from '@/app/common/ui/app-shell'
import { IconBox } from '@/app/common/ui/icon-box'
import { SectionLabel } from '@/app/common/ui/section-label'
import { cn } from '@/app/common/utils'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
  variant?: 'banner' | 'simple' | 'hero'
  icon?: LucideIcon
  eyebrow?: string
}

const pageTitleClass =
  'relative text-balance font-heading text-[1.75rem] font-bold tracking-tightish text-foreground lg:text-[2rem] lg:leading-[1.28]'
const pageLeadClass =
  'relative mt-2.5 max-w-2xl text-[0.95rem] leading-[1.7] text-muted-foreground'

export function PageHeader({
  title,
  description,
  children,
  className,
  variant = 'banner',
  icon: Icon,
  eyebrow,
}: PageHeaderProps) {
  if (variant === 'simple') {
    return (
      <header
        className={cn(
          'flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between',
          className
        )}
      >
        <div className="min-w-0">
          {eyebrow && <SectionLabel className="mb-2">{eyebrow}</SectionLabel>}
          <h1 className={pageTitleClass}>{title}</h1>
          {description && <p className={pageLeadClass}>{description}</p>}
        </div>
        {children && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
        )}
      </header>
    )
  }


  if (variant === 'hero') {
    return (
      <PageHeaderBanner className={cn('border-l-0 px-6 py-8 lg:px-10 lg:py-10', className)}>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            {Icon && (
              <IconBox variant="primary" className="size-14">
                <Icon className="size-6" strokeWidth={2} />
              </IconBox>
            )}
            <div className="min-w-0">
              {eyebrow && <SectionLabel className="mb-2">{eyebrow}</SectionLabel>}
              <h1 className={pageTitleClass}>{title}</h1>
              {description && <p className={pageLeadClass}>{description}</p>}
            </div>
          </div>
          {children && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
          )}
        </div>
      </PageHeaderBanner>
    )
  }

  return (
    <PageHeaderBanner className={className}>
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <IconBox variant="primary" className="size-12">
              <Icon className="size-5" strokeWidth={2} />
            </IconBox>
          )}
          <div className="min-w-0">
            {eyebrow && <SectionLabel className="mb-1.5">{eyebrow}</SectionLabel>}
            <h1 className={pageTitleClass}>{title}</h1>
            {description && <p className={pageLeadClass}>{description}</p>}
          </div>
        </div>
        {children && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
    </PageHeaderBanner>
  )
}
