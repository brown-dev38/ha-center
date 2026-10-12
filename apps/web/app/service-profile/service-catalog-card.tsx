import type { ServiceCatalogItem } from '@/app/service-profile/service-profile'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

type Props = {
  item: ServiceCatalogItem
}

export function ServiceCatalogCard({ item }: Props) {
  const Icon = item.icon

  return (
    <article
      className={cn(
        cn(surfaceCardClass(), 'flex h-full flex-col overflow-hidden transition duration-300'),
        item.highlight && 'ring-1 ring-primary/25'
      )}
    >
      <div
        className={cn(
          'border-b border-border/60 px-5 py-4',
          item.highlight
            ? 'bg-gradient-to-r from-primary/[0.08] to-ha-green/[0.05]'
            : 'bg-muted/20'
        )}
      >
        
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              item.highlight
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {item.departmentCode}
              </span>
              <span className="text-[10px] text-muted-foreground">{item.department}</span>
            </div>
            <h3 className="mt-1.5 font-semibold leading-snug text-foreground">{item.title}</h3>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        {item.standardRef && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">มาตรฐาน HA: </span>
            {item.standardRef}
          </p>
        )}
        <div className="mt-auto">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            ผลลัพธ์ที่ส่งมอบ
          </p>
          <ul className="space-y-1">
            {item.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 text-xs text-foreground/90">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--ha-green)]" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
