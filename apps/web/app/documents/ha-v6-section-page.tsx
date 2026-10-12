'use client'

import { notFound } from 'next/navigation'
import { getHaV6Section } from '@/app/documents/ha-v6-sections'
import { HaV6ProgressDashboard } from '@/app/documents/ha-v6-progress-dashboard'
import { HaV6CoreDocumentsPage } from '@/app/documents/ha-v6-core-documents-page'
import { HaV6GovernancePage } from '@/app/documents/ha-v6-governance-page'
import { HaV6HospitalOperationsPage } from '@/app/documents/ha-v6-hospital-operations-page'
import { HaV6OutcomesPage } from '@/app/documents/ha-v6-outcomes-page'
import { HaV6PatientCarePage } from '@/app/documents/ha-v6-patient-care-page'
import { HaV6UnitProfileTrackerPage } from '@/app/documents/ha-v6-unit-profile-tracker-page'
import { EmptyState } from '@/app/empty-state'
import { PageHeader } from '@/app/page-header'

export function HaV6SectionPage({ slug }: { slug: string }) {
  if (slug === 'dashboard') {
    return <HaV6ProgressDashboard />
  }

  if (slug === 'core') {
    return <HaV6CoreDocumentsPage />
  }

  if (slug === 'governance') {
    return <HaV6GovernancePage />
  }

  if (slug === 'hospital-operations') {
    return <HaV6HospitalOperationsPage />
  }

  if (slug === 'patient-care') {
    return <HaV6PatientCarePage />
  }

  if (slug === 'outcomes') {
    return <HaV6OutcomesPage />
  }

  if (slug === 'unit-profile') {
    return <HaV6UnitProfileTrackerPage />
  }

  const section = getHaV6Section(slug)
  if (!section) notFound()

  const Icon = section.icon

  return (
    <div className="space-y-6">
      <PageHeader
        title={section.label}
        description={section.description}
        icon={Icon}
        eyebrow="เอกสารมาตรฐาน HA ฉบับที่ 6"
      />
      <EmptyState
        title="กำลังจัดเตรียมเนื้อหา"
        description="ส่วนนี้อยู่ระหว่างการพัฒนา — จะเปิดใช้งานเร็ว ๆ นี้"
      />
    </div>
  )
}
