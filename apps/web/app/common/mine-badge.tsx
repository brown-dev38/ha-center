'use client'

import { UserRound } from 'lucide-react'
import { cn } from '@/app/common/utils'

/** สัญลักษณ์ระบุว่าเอกสารนี้เป็นของคนที่ล็อกอินอยู่ */
export function MineBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800',
        className
      )}
      title="เอกสารที่คุณเป็นผู้จัดทำ / อัปโหลด"
    >
      <UserRound className="size-3" aria-hidden />
      ของฉัน
    </span>
  )
}
