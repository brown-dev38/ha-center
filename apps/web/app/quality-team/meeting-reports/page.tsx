'use client'

import { FileText } from 'lucide-react'
import { CategoryDocumentsView } from '@/app/documents/category-documents-view'

export default function QualityTeamMeetingReportsPage() {
  return (
    <CategoryDocumentsView
      pageKey="quality-team-meetings"
      title="รายงานการประชุมทีมนำคุณภาพ"
      description="รายงานการประชุมทีมนำคุณภาพ — เอกสาร PDF"
      categoryCode="QT-MINUTES"
      icon={FileText}
      emptyTitle="ยังไม่มีรายงานการประชุม"
      emptyHint="อัปโหลดรายงานการประชุมทีมนำคุณภาพ (PDF)"
    />
  )
}
