'use client'

import { useState } from 'react'
import { Award, GraduationCap, Search, Settings2 } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { ElearnOverviewPanel } from '@/app/elearning/elearn-overview-panel'
import { ElearnCourseCard } from '@/app/elearning/elearn-course-card'
import { ElearnCertificatesPanel } from '@/app/elearning/elearn-certificates-panel'
import { ElearnAuthoringPanel } from '@/app/elearning/elearn-authoring-panel'
import { useElearnCourses } from '@/hooks/use-elearning'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/app/common/utils'

type Tab = 'courses' | 'certificates' | 'manage'

export default function ElearningPage() {
  const [tab, setTab] = useState<Tab>('courses')
  const [search, setSearch] = useState('')
  const { canLearnElearning, hasPermission } = usePermissions()
  const canManage = hasPermission('elearning:write')

  const { data: res, isLoading } = useElearnCourses({
    search: search.trim() || undefined,
    isPublished: 'true',
    limit: 50,
  })

  const courses = res?.data ?? []

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="elearning"
        title="E-learning HA"
        description="เรียนรู้พื้นฐาน Hospital Accreditation — บทเรียน แบบฝึกหัด และข้อสอบวัดผล"
      />

      <ElearnOverviewPanel />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-border p-1">
          <Button
            type="button"
            size="sm"
            variant={tab === 'courses' ? 'default' : 'ghost'}
            className="gap-1.5 rounded-lg"
            onClick={() => setTab('courses')}
          >
            <GraduationCap className="size-3.5" />
            หลักสูตร
          </Button>
          {canLearnElearning() && (
            <Button
              type="button"
              size="sm"
              variant={tab === 'certificates' ? 'default' : 'ghost'}
              className="gap-1.5 rounded-lg"
              onClick={() => setTab('certificates')}
            >
              <Award className="size-3.5" />
              ใบรับรองของฉัน
            </Button>
          )}
          {canManage && (
            <Button
              type="button"
              size="sm"
              variant={tab === 'manage' ? 'default' : 'ghost'}
              className="gap-1.5 rounded-lg"
              onClick={() => setTab('manage')}
            >
              <Settings2 className="size-3.5" />
              จัดการหลักสูตร
            </Button>
          )}
        </div>
        {tab === 'courses' && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาหลักสูตร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {tab === 'courses' && (
        <>
          {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดหลักสูตร...</p>}
          {!isLoading && courses.length === 0 && (
            <EmptyState
              icon={GraduationCap}
              title="ยังไม่มีหลักสูตร"
              description="รัน npm run db:seed ที่รากโปรเจกต์"
            />
          )}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <ElearnCourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      )}

      {tab === 'certificates' && canLearnElearning() && <ElearnCertificatesPanel />}

      {tab === 'manage' && canManage && <ElearnAuthoringPanel />}
    </div>
  )
}
