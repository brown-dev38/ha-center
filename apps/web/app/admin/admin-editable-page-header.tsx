'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/app/page-header'
import { AdminEditableText, AdminEditModeHint } from '@/app/admin/admin-inline-edit'
import { usePageText } from '@/hooks/use-app-config'

type AdminEditablePageHeaderProps = {
  pageKey: string
  title: string
  description?: string
  /** ข้อความนำหน้าคำอธิบาย (เช่น คำทักทาย) — ไม่รวมในการแก้ไข */
  descriptionPrefix?: ReactNode
  children?: ReactNode
  icon?: LucideIcon
  eyebrow?: string
  variant?: 'banner' | 'simple' | 'hero'
  showEditHint?: boolean
}

/** หัวข้อหน้าที่แอดมินแก้ไขได้ตรงบนหน้านั้น */
export function AdminEditablePageHeader({
  pageKey,
  title,
  description,
  descriptionPrefix,
  children,
  icon,
  eyebrow,
  variant = 'banner',
  showEditHint = true,
}: AdminEditablePageHeaderProps) {
  const pageText = usePageText(pageKey, { title, description })

  return (
    <div className="space-y-3">
      {showEditHint && <AdminEditModeHint />}
      <PageHeader
        title={
          <AdminEditableText
            value={pageText.title ?? title}
            defaultValue={title}
            scope={{ kind: 'page-text', pageKey, field: 'title', label: 'หัวข้อหน้า' }}
            textClassName="inherit"
          />
        }
        description={
          (pageText.description ?? description) ? (
            <>
              {descriptionPrefix}
              <AdminEditableText
                value={pageText.description ?? description ?? ''}
                defaultValue={description}
                scope={{ kind: 'page-text', pageKey, field: 'description', label: 'คำอธิบายหน้า' }}
                multiline
                textClassName="inherit"
              />
            </>
          ) : descriptionPrefix ? (
            descriptionPrefix
          ) : undefined
        }
        icon={icon}
        eyebrow={eyebrow}
        variant={variant}
      >
        {children}
      </PageHeader>
    </div>
  )
}
