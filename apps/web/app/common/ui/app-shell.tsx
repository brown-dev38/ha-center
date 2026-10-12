import type { ComponentProps } from 'react'
import { cn } from '@/app/common/utils'

export function AppShell({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('ha-mesh flex min-h-screen bg-background', className)} {...props} />
}

export function AppSidebar({ className, ...props }: ComponentProps<'aside'>) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh w-72 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-[8px_0_24px_-20px_rgba(15,23,42,0.18)] lg:flex',
        className
      )}
      {...props}
    />
  )
}

export function AppMain({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main className={cn('relative flex-1 overflow-auto bg-[#f8fafc]', className)} {...props} />
  )
}

export function AppMainInner({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative mx-auto w-full max-w-6xl', className)} {...props} />
}

/** พื้นที่เนื้อหาเต็มความกว้าง — เหมาะกับตารางข้อมูลกว้าง */
export function AppMainInnerWide({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative mx-auto w-full max-w-none', className)} {...props} />
}

export function AppContentCanvas({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('relative min-h-full px-6 py-8 lg:px-10 lg:py-10', className)} {...props} />
  )
}

export function AppTopBar({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'ha-glass sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-3 lg:px-10 lg:py-3.5',
        className
      )}
      {...props}
    />
  )
}

export function LoginBackdrop({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10',
        'bg-[#f8fafc]',
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 85% -10%, rgba(109,40,217,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(13,148,136,0.1), transparent 50%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}

export function PageHeaderBanner({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'ha-card relative overflow-hidden rounded-2xl border border-slate-200 px-6 py-6 lg:px-8 lg:py-7',
        'before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:rounded-l-2xl before:bg-[#6d28d9]',
        className
      )}
      {...props}
    />
  )
}

export function PageStack({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-8 lg:gap-10', className)} {...props} />
}

export function PageSection({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('flex flex-col gap-5', className)} {...props} />
}

export function PremiumCard({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'ha-card group relative overflow-hidden rounded-2xl border border-slate-200 text-card-foreground transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_16px_40px_-20px_rgba(109,40,217,0.28)]',
        className
      )}
      {...props}
    />
  )
}
