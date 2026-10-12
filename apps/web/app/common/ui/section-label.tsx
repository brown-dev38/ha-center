import type { ComponentProps } from 'react'
import { cn } from '@/app/common/utils'

export function SectionLabel({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6d28d9]',
        'before:h-3 before:w-1 before:rounded-full before:bg-[#6d28d9]',
        className
      )}
      {...props}
    />
  )
}

export function sectionLabelClass(className?: string) {
  return cn(
    'inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6d28d9]',
    'before:h-3 before:w-1 before:rounded-full before:bg-[#6d28d9]',
    className
  )
}

export function SectionTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'font-heading text-[1.05rem] font-bold leading-snug text-foreground',
        className
      )}
      {...props}
    />
  )
}

export function SectionDesc({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
  )
}
