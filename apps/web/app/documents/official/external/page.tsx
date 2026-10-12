'use client'

import { InternalLettersView } from '@/app/documents/internal-letters-view'

export default function OfficialExternalDocumentsPage() {
  return (
    <InternalLettersView
      pageKey="documents-official-external"
      title="หนังสือภายนอก"
      description="เอกสารราชการประเภทหนังสือโต้ตอบหน่วยงานภายนอก"
      categoryCode="GOV-OUT"
    />
  )
}
