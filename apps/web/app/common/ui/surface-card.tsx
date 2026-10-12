import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/app/common/utils'

const surfaceBase =
  'ha-card gap-0 overflow-hidden border-slate-200 py-0 transition-[box-shadow,border-color,transform,background-color] duration-200'

const surfaceInteractive =
  'cursor-pointer hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_14px_32px_-18px_rgba(109,40,217,0.28)]'

/** shadcn Card styled as HA surface panel */
export function SurfaceCard({
  className,
  interactive,
  ...props
}: ComponentProps<typeof Card> & { interactive?: boolean }) {
  return (
    <Card
      className={cn(surfaceBase, interactive && surfaceInteractive, className)}
      {...props}
    />
  )
}

export function surfaceCardClass(className?: string, interactive?: boolean) {
  return cn(surfaceBase, interactive && surfaceInteractive, className)
}
