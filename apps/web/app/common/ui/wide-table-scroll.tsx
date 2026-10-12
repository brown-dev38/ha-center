'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronsRight } from 'lucide-react'
import { cn } from '@/app/common/utils'

type WideTableScrollProps = {
  children: React.ReactNode
  className?: string
  /** คำใบ้ใต้แถบเลื่อน */
  hint?: string
  minWidthPx?: number
}

/** ห่อตารางกว้าง — scrollbar ชัด + คำใบ้เมื่อเลื่อนได้ */
export function WideTableScroll({
  children,
  className,
  hint = 'เลื่อนขวาเพื่อดูคอลัมน์อื่น',
  minWidthPx,
}: WideTableScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  const [atEnd, setAtEnd] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const overflow = el.scrollWidth > el.clientWidth + 2
      setCanScroll(overflow)
      setAtEnd(!overflow || el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [minWidthPx, children])

  return (
    <div className={cn('space-y-2', className)}>
      {canScroll && (
        <div className="flex items-center justify-between gap-2 px-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ChevronsRight className="size-3.5 text-primary/70" aria-hidden />
            {hint}
          </span>
          {!atEnd && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              มีคอลัมน์เพิ่มทางขวา
            </span>
          )}
        </div>
      )}
      <div
        ref={ref}
        className={cn(
          'overflow-x-auto rounded-xl border border-border/70',
          '[&::-webkit-scrollbar]:h-2.5',
          '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/35',
          'hover:[&::-webkit-scrollbar-thumb]:bg-primary/55'
        )}
      >
        {children}
      </div>
    </div>
  )
}
