'use client'

import { ScrollText } from 'lucide-react'
import { CategoryDocumentsView } from '@/app/documents/category-documents-view'

export default function QualityTeamOrdersPage() {
  return (
    <CategoryDocumentsView
      pageKey="quality-team-orders"
      title="รายชื่อคำสั่งคณะกรรมการทีมนำ"
      description="คำสั่งแต่งตั้งและโครงสร้างทีมนำคุณภาพ — เอกสาร PDF"
      categoryCode="QT-ORDER"
      icon={ScrollText}
      emptyTitle="ยังไม่มีคำสั่งแต่งตั้ง"
      emptyHint="อัปโหลดคำสั่งแต่งตั้งคณะกรรมการทีมนำคุณภาพ (PDF)"
    />
  )
}
