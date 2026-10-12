'use client'

import { HeartPulse } from 'lucide-react'
import { HaV6DocumentsTable } from '@/app/documents/ha-v6-documents-table'
import { HA_V6_SECTION_III_GROUP_LABELS } from '@/app/documents/ha-v6-section-iii-seed'
import { useHaV6SectionDocuments } from '@/app/documents/use-ha-v6-tracker'
import { usePageText } from '@/hooks/use-app-config'

export function HaV6PatientCarePage() {
  const documents = useHaV6SectionDocuments('section-iii')
  const pageText = usePageText('ha-v6-patient-care', {
    title: 'กระบวนการดูแลผู้ป่วย',
    description: 'ตอนที่ III กระบวนการดูแลผู้ป่วย — Patient Care Processes (III-1 ถึง III-6)',
    tableTitle: 'ตอนที่ III กระบวนการดูแลผู้ป่วย / Patient Care Processes (III-1 ถึง III-6)',
    tableDescription:
      'แก้ไขสถานะจัดทำและ % คืบหน้าได้ — ข้อมูลตอน III จะคำนวณไปยังแดชบอร์ดอัตโนมัติ',
  })

  return (
    <HaV6DocumentsTable
      pageKey="ha-v6-patient-care"
      sectionId="section-iii"
      pageTitle={pageText.title ?? 'กระบวนการดูแลผู้ป่วย'}
      pageDescription={pageText.description ?? ''}
      pageIcon={HeartPulse}
      tableTitle={pageText.tableTitle ?? ''}
      tableDescription={pageText.tableDescription ?? ''}
      documents={documents}
      groupLabels={HA_V6_SECTION_III_GROUP_LABELS}
    />
  )
}
