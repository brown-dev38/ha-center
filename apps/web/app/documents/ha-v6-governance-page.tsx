'use client'

import { Building2 } from 'lucide-react'
import { HaV6DocumentsTable } from '@/app/documents/ha-v6-documents-table'
import { HA_V6_SECTION_I_GROUP_LABELS } from '@/app/documents/ha-v6-section-i-seed'
import { useHaV6SectionDocuments } from '@/app/documents/use-ha-v6-tracker'
import { usePageText } from '@/hooks/use-app-config'

export function HaV6GovernancePage() {
  const documents = useHaV6SectionDocuments('section-i')
  const pageText = usePageText('ha-v6-governance', {
    title: 'ภาพรวมของการบริหารองค์กร',
    description:
      'ตอนที่ I ภาพรวมของการบริหารองค์กร — Organization Management Overview (I-1 ถึง I-6)',
    tableTitle: 'ตอนที่ I ภาพรวมของการบริหารองค์กร / Organization Management Overview (I-1 ถึง I-6)',
    tableDescription:
      'แก้ไขสถานะจัดทำและ % คืบหน้าได้ — ข้อมูลตอน I จะคำนวณไปยังแดชบอร์ดอัตโนมัติ',
  })

  return (
    <HaV6DocumentsTable
      pageKey="ha-v6-governance"
      sectionId="section-i"
      pageTitle={pageText.title ?? 'ภาพรวมของการบริหารองค์กร'}
      pageDescription={pageText.description ?? ''}
      pageIcon={Building2}
      tableTitle={pageText.tableTitle ?? ''}
      tableDescription={pageText.tableDescription ?? ''}
      documents={documents}
      groupLabels={HA_V6_SECTION_I_GROUP_LABELS}
    />
  )
}
