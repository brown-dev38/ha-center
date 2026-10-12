'use client'

import { Network } from 'lucide-react'
import { HaV6DocumentsTable } from '@/app/documents/ha-v6-documents-table'
import { HA_V6_SECTION_II_GROUP_LABELS } from '@/app/documents/ha-v6-section-ii-seed'
import { useHaV6SectionDocuments } from '@/app/documents/use-ha-v6-tracker'
import { usePageText } from '@/hooks/use-app-config'

export function HaV6HospitalOperationsPage() {
  const documents = useHaV6SectionDocuments('section-ii')
  const pageText = usePageText('ha-v6-hospital-operations', {
    title: 'ระบบงานสำคัญของโรงพยาบาล',
    description:
      'ตอนที่ II ระบบงานสำคัญของโรงพยาบาล — Key Hospital Systems (II-1 ถึง II-10) * เพิ่ม II-10 Digital Care',
    tableTitle:
      'ตอนที่ II ระบบงานสำคัญของโรงพยาบาล / Key Hospital Systems (II-1 ถึง II-10) * เพิ่ม II-10 Digital Care',
    tableDescription:
      'แก้ไขสถานะจัดทำและ % คืบหน้าได้ — ข้อมูลตอน II จะคำนวณไปยังแดชบอร์ดอัตโนมัติ',
  })

  return (
    <HaV6DocumentsTable
      pageKey="ha-v6-hospital-operations"
      sectionId="section-ii"
      pageTitle={pageText.title ?? 'ระบบงานสำคัญของโรงพยาบาล'}
      pageDescription={pageText.description ?? ''}
      pageIcon={Network}
      tableTitle={pageText.tableTitle ?? ''}
      tableDescription={pageText.tableDescription ?? ''}
      documents={documents}
      groupLabels={HA_V6_SECTION_II_GROUP_LABELS}
    />
  )
}
