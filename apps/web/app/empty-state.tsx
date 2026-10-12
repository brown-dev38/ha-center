import type { LucideIcon } from 'lucide-react'
import { cn } from '@/app/common/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center',
        className
      )}
    >
      <div className="relative mb-4 flex size-14 items-center justify-center rounded-xl bg-[#6d28d9] text-white shadow-[0_8px_20px_-8px_rgba(109,40,217,0.5)]">
        <Icon className="size-6" strokeWidth={1.75} />
      </div>
      <p className="relative font-heading text-[0.98rem] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      {description && (
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="relative mt-6">{children}</div>}
    </div>
  )
}
