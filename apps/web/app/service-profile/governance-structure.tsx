import { GOVERNANCE_STRUCTURE } from '@/app/service-profile/service-profile'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

export function GovernanceStructure() {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {GOVERNANCE_STRUCTURE.map((node, i) => (
        <div key={node.level} className="flex w-full max-w-xl flex-col items-center">
          <div
            className={cn(
              cn(surfaceCardClass(), 'w-full px-5 py-4 text-center transition'),
              i === 0 && 'border-primary/30 bg-primary/[0.04]',
              i === GOVERNANCE_STRUCTURE.length - 1 && 'border-[var(--ha-green)]/30 bg-ha-green/5'
            )}
            style={{ width: `${100 - i * 12}%`, minWidth: '72%' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              ระดับ {node.level}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">{node.title}</p>
            <p className="mt-0.5 text-sm font-medium text-primary/90">{node.role}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{node.focus}</p>
          </div>
          {i < GOVERNANCE_STRUCTURE.length - 1 && (
            <div className="my-1 h-6 w-px bg-gradient-to-b from-primary/40 to-[var(--ha-green)]/40" />
          )}
        </div>
      ))}
    </div>

     


  )
}
