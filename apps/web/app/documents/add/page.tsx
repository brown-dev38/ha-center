'use client'

import { Archive } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { DocumentsAddForm } from '@/app/documents/documents-add-form'
import { EmptyState } from '@/app/empty-state'
import { cn } from '@/app/common/utils'

export default function AddQualityDocumentPage() {
  const { canWriteDocuments, roleLabel } = usePermissions()
  const canUpload = canWriteDocuments()

  if (!canUpload) {
    return (
      <div className={cn('flex flex-col gap-8 lg:gap-10')}>
        <EmptyState
          icon={Archive}
          title="ไม่มีสิทธิ์เพิ่มเอกสาร"
          description={`บทบาท ${roleLabel || 'ปัจจุบัน'} ไม่สามารถอัปโหลดได้ — ติดต่อผู้ดูแลระบบ`}
        />
      </div>
    )
  }

  return (
    <div className={cn('mx-auto w-full max-w-5xl')}>
      <DocumentsAddForm />
    </div>
  )
}
