import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { IconBox } from '@/app/common/ui/icon-box'
import { cn } from '@/app/common/utils'

type StatCardProps = {
  label: string
  value: string | number
  icon?: LucideIcon
  loading?: boolean
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  hint?: string
  trend?: {
    value: number
    label?: string
  }
}

const variants = {
  primary: {
    iconVariant: 'primary' as const,
    accent: 'from-primary/[0.06] via-transparent to-transparent',
    bar: 'from-ha-primary via-ha-secondary to-ha-green',
    trendUp: 'text-emerald-700 bg-emerald-50',
    trendDown: 'text-rose-700 bg-rose-50',
  },
  success: {
    iconVariant: 'success' as const,
    accent: 'from-ha-green/[0.06] via-transparent to-transparent',
    bar: 'from-emerald-400 to-teal-500',
    trendUp: 'text-emerald-700 bg-emerald-50',
    trendDown: 'text-rose-700 bg-rose-50',
  },
  warning: {
    iconVariant: 'warning' as const,
    accent: 'from-amber-100/40 via-transparent to-transparent',
    bar: 'from-amber-300 to-orange-400',
    trendUp: 'text-emerald-700 bg-emerald-50',
    trendDown: 'text-rose-700 bg-rose-50',
  },
  danger: {
    iconVariant: 'danger' as const,
    accent: 'from-rose-100/40 via-transparent to-transparent',
    bar: 'from-rose-300 to-rose-500',
    trendUp: 'text-emerald-700 bg-emerald-50',
    trendDown: 'text-rose-700 bg-rose-50',
  },
  neutral: {
    iconVariant: 'primary' as const,
    accent: 'from-muted/40 via-transparent to-transparent',
    bar: 'from-slate-300 to-slate-400',
    trendUp: 'text-emerald-700 bg-emerald-50',
    trendDown: 'text-rose-700 bg-rose-50',
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  variant = 'neutral',
  hint,
  trend,
}: StatCardProps) {
  const v = variants[variant]
  const trendPositive = trend && trend.value >= 0

  return (
    <Card className="group relative gap-0 overflow-hidden p-5 py-5 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100',
          v.accent
        )}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-[1.85rem] font-bold tracking-tight text-foreground tabular-nums">
            {loading ? (
              <span className="inline-block h-7 w-14 animate-pulse rounded bg-muted/60" />
            ) : (
              value
            )}
          </p>
          {hint && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
          )}
          {trend && !loading && (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                trendPositive ? v.trendUp : v.trendDown
              )}
            >
              {trendPositive ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%
              {trend.label && (
                <span className="ml-1 font-medium opacity-80">{trend.label}</span>
              )}
            </p>
          )}
        </div>
        {Icon && (
          <IconBox
            variant={v.iconVariant}
            className="size-11 transition-transform duration-300 group-hover:scale-105"
          >
            <Icon className="size-5" strokeWidth={2} />
          </IconBox>
        )}
      </div>

      <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-border/60">
        <div className={cn('h-full w-1/2 rounded-full bg-gradient-to-r', v.bar)} />
      </div>
    </Card>
  )
}
