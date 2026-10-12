import Image from 'next/image'
import { cn } from '@/app/common/utils'

const sizes = {
  sm: { box: 'size-10', px: 36 },
  md: { box: 'size-12', px: 44 },
  lg: { box: 'size-16', px: 56 },
  xl: { box: 'size-24', px: 88 },
} as const

type HaLogoProps = {
  size?: keyof typeof sizes
  className?: string
  framed?: boolean
  priority?: boolean
}

export function HaLogo({ size = 'md', className, framed = true, priority }: HaLogoProps) {
  const s = sizes[size]
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden',
        framed && 'rounded-2xl bg-white ring-1 ring-primary/15 shadow-sm',
        s.box,
        className
      )}
    >
      <Image
        src="/logo2.png"
        alt="โรงพยาบาลมหาวิทยาลัยพะเยา"
        width={s.px}
        height={s.px}
        className="h-full w-full object-contain p-1"
        priority={priority}
      />
    </div>
  )
}
