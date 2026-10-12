'use client'

import { FileText } from 'lucide-react'
import { HaV6DocumentsTable } from '@/app/documents/ha-v6-documents-table'
import { useHaV6SectionDocuments } from '@/app/documents/use-ha-v6-tracker'
import { usePageText } from '@/hooks/use-app-config'

export function HaV6CoreDocumentsPage() {
  const documents = useHaV6SectionDocuments('core')
  const pageText = usePageText('ha-v6-core', {
    title: 'แฟ้มเอกสารแกนหลัก HA ฉบับที่ 6',
    description: 'เอกสารระดับองค์กร ที่ต้องมีทุกครั้ง',
    tableTitle: 'เอกสารแกนหลักระดับองค์กร (Core Organizational Documents)',
  })

  return (
    <HaV6DocumentsTable
      pageKey="ha-v6-core"
      sectionId="core"
      pageTitle={pageText.title ?? 'แฟ้มเอกสารแกนหลัก HA ฉบับที่ 6'}
      pageDescription={pageText.description ?? ''}
      pageIcon={FileText}
      tableTitle={pageText.tableTitle ?? 'เอกสารแกนหลักระดับองค์กร (Core Organizational Documents)'}
      tableDescription={pageText.tableDescription ?? ''}
      documents={documents}
    />
  )
}
