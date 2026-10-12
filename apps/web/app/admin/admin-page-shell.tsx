'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { AdminGuard } from '@/app/common/admin-guard'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { usePageText, useUILabel } from '@/hooks/use-app-config'
import { cn } from '@/app/common/utils'

type AdminPageShellProps = {
  pageKey: string
  title: string
  description: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

export function AdminPageShell({
  pageKey,
  title,
  description,
  icon,
  children,
  className,
}: AdminPageShellProps) {
  const pageText = usePageText(pageKey, { title, description })
  const adminHomeLabel = useUILabel('admin.breadcrumb.home', 'ศูนย์ควบคุมระบบ')
  const eyebrow = useUILabel('admin.eyebrow', 'ระบบหลังบ้าน')

  return (
    <AdminGuard>
      <div className={cn('flex flex-col gap-8 lg:gap-10', className)}>
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1 font-medium transition hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            {adminHomeLabel}
          </Link>
          <ChevronRight className="size-3.5 opacity-40" />
          <span className="font-medium text-foreground">{pageText.title}</span>
        </nav>

        <AdminEditablePageHeader
          pageKey={pageKey}
          title={title}
          description={description}
          icon={icon}
          variant="hero"
          eyebrow={eyebrow}
        />
        {children}
      </div>
    </AdminGuard>
  )
}
