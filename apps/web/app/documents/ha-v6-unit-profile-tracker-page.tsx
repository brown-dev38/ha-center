'use client'

import { Users } from 'lucide-react'
import { HaV6DocumentsTable } from '@/app/documents/ha-v6-documents-table'
import { HA_V6_SP_PCT_GROUP_LABELS } from '@/app/documents/ha-v6-sp-pct-seed'
import { useHaV6SectionDocuments } from '@/app/documents/use-ha-v6-tracker'
import { usePageText } from '@/hooks/use-app-config'

export function HaV6UnitProfileTrackerPage() {
  const documents = useHaV6SectionDocuments('sp-pct')
  const pageText = usePageText('ha-v6-unit-profile', {
    title: 'โปรไฟล์หน่วยงานและกลุ่มดูแลผู้ป่วย',
    description: 'Service Profile & Clinical Tracer — SP และ PCT',
    tableTitle: 'Service Profile & Clinical Tracer',
    tableDescription: 'ติดตามโปรไฟล์รายหน่วยงาน (SP) และกลุ่มโรค/Clinical Tracer (PCT)',
  })

  return (
    <HaV6DocumentsTable
      pageKey="ha-v6-unit-profile"
      sectionId="sp-pct"
      pageTitle={pageText.title ?? 'โปรไฟล์หน่วยงานและกลุ่มดูแลผู้ป่วย'}
      pageDescription={pageText.description ?? ''}
      pageIcon={Users}
      tableTitle={pageText.tableTitle ?? ''}
      tableDescription={pageText.tableDescription ?? ''}
      documents={documents}
      groupLabels={HA_V6_SP_PCT_GROUP_LABELS}
    />
  )
}
