'use client'

import { BarChart3 } from 'lucide-react'
import { HaV6DocumentsTable } from '@/app/documents/ha-v6-documents-table'
import { useHaV6SectionDocuments } from '@/app/documents/use-ha-v6-tracker'
import { usePageText } from '@/hooks/use-app-config'

export function HaV6OutcomesPage() {
  const documents = useHaV6SectionDocuments('section-iv')
  const pageText = usePageText('ha-v6-outcomes', {
    title: 'ผลการดำเนินการ',
    description: 'ตอนที่ IV ผลการดำเนินการ — Performance Results (IV-1 ถึง IV-6, LeTCI)',
    tableTitle: 'ตอนที่ IV ผลการดำเนินการ / Performance Results (IV-1 ถึง IV-6, LeTCI)',
    tableDescription: 'ตอนที่ IV ผลการดำเนินการ (Performance Results) — รายงานด้วยกรอบ LeTCI',
  })

  return (
    <HaV6DocumentsTable
      pageKey="ha-v6-outcomes"
      sectionId="section-iv"
      pageTitle={pageText.title ?? 'ผลการดำเนินการ'}
      pageDescription={pageText.description ?? ''}
      pageIcon={BarChart3}
      tableTitle={pageText.tableTitle ?? ''}
      tableDescription={pageText.tableDescription ?? ''}
      documents={documents}
    />
  )
}
