import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/app/common/utils'

const iconBoxVariants = cva(
  'flex shrink-0 items-center justify-center rounded-xl',
  {
    variants: {
      variant: {
        primary:
          'bg-[#6d28d9] text-white shadow-[0_6px_16px_-6px_rgba(109,40,217,0.55)]',
        success:
          'bg-[#0d9488] text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.45)]',
        warning:
          'bg-amber-500 text-white shadow-[0_6px_16px_-6px_rgba(217,119,6,0.4)]',
        danger:
          'bg-rose-600 text-white shadow-[0_6px_16px_-6px_rgba(225,29,72,0.4)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

export function IconBox({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof iconBoxVariants>) {
  return <span className={cn(iconBoxVariants({ variant }), className)} {...props} />
}

export function iconBoxClass(
  variant: NonNullable<VariantProps<typeof iconBoxVariants>['variant']> = 'primary',
  className?: string
) {
  return cn(iconBoxVariants({ variant }), className)
}
