'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { PageHeader } from '@/app/page-header'
import { cn } from '@/app/common/utils'

const LINKS = [
  { href: '/dashboard/complaints', label: 'แดชบอร์ด' },
  { href: '/dashboard/complaints/registry', label: 'ทะเบียนเรื่อง' },
  { href: '/dashboard/complaints/import', label: 'นำเข้า Excel' },
  { href: '/dashboard/complaints/tracking', label: 'ติดตามเรื่อง' },
]

export function ComplaintsFrame({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8">
      <PageHeader title={title} description={description} icon={Inbox} eyebrow="รับเรื่องร้องเรียน" variant="hero">
        {actions}
      </PageHeader>
      <nav className="flex flex-wrap gap-2">
        {LINKS.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium',
                active
                  ? 'border-[#6d28d9] bg-[#6d28d9] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
