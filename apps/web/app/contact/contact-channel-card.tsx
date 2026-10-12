import type { ContactChannel } from '@/app/contact/contact'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'
import { ExternalLink } from 'lucide-react'

const accentStyles = {
  primary: 'from-primary/10 to-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground',
  teal: 'from-ha-green/15 to-ha-green/5 text-[var(--ha-green)] group-hover:bg-[var(--ha-green)] group-hover:text-white',
  neutral: 'from-muted to-muted/50 text-muted-foreground group-hover:bg-foreground group-hover:text-background',
}

type Props = {
  channel: ContactChannel
}

export function ContactChannelCard({ channel }: Props) {
  const Icon = channel.icon
  const inner = (
    <>
      <div
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br transition duration-300',
          accentStyles[channel.accent]
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {channel.title}
        </p>
        <p className="mt-1 font-semibold leading-snug text-foreground">{channel.value}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{channel.description}</p>
      </div>
      {channel.href && (
        <ExternalLink className="size-4 shrink-0 text-muted-foreground/40 transition group-hover:text-primary" />
      )}
    </>
  )

  const className = cn(
    cn(surfaceCardClass(undefined, true), 'group flex items-start gap-4 p-5 transition-all duration-300'),
    channel.href && 'cursor-pointer'
  )

  if (channel.href) {
    return (
      <a href={channel.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    )
  }

  return <div className={className}>{inner}</div>
}
