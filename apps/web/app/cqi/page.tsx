'use client'

import { useMemo, useState } from 'react'
import { Award, Building2, ClipboardCheck, Search, Sparkles, Target } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { CqiDepartmentCard } from '@/app/cqi/cqi-department-card'
import { CqiProjectCard } from '@/app/cqi/cqi-project-card'
import { CqiOutstandingShowcase } from '@/app/cqi/cqi-outstanding-showcase'
import { useCQI, useCqiDepartmentsSummary } from '@/hooks/use-cqi'
import { CQI_SYSTEM_OVERVIEW } from '@/app/cqi/cqi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CqiProjectFormDialog } from '@/app/cqi/cqi-project-form-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'
type CqiTab = 'departments' | 'projects' | 'outstanding'

const TABS: { id: CqiTab; label: string; icon: typeof Building2 }[] = [
  { id: 'departments', label: 'ตามหน่วยงาน',  icon: Building2 },
  { id: 'projects',    label: 'ผลงานทั้งหมด',  icon: ClipboardCheck },
  { id: 'outstanding', label: 'ผลงานโดดเด่น',  icon: Award },
]

export default function CQIPage() {
  const [tab, setTab] = useState<CqiTab>('departments')
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<number | ''>('')

  const yearFilter = year === '' ? undefined : Number(year)
  const buddhistYear = new Date().getFullYear() + 543
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('cqi:write')

  const { data: deptSummary, isLoading: deptLoading } = useCqiDepartmentsSummary()
  const { data: listRes, isLoading: listLoading } = useCQI({
    departmentId: departmentId ?? undefined,
    year: yearFilter,
    search: search.trim() || undefined,
    limit: 100,
  })

  const projects = listRes?.data ?? []
  const stats = useMemo(() => {
    const depts = deptSummary ?? []
    return {
      departments: depts.length,
      total: depts.reduce((s, d) => s + d.total, 0),
      completed: depts.reduce((s, d) => s + d.completed, 0),
      outstanding: depts.reduce((s, d) => s + d.outstanding, 0),
    }
  }, [deptSummary])

  const selectedDept = deptSummary?.find((d) => d.department.id === departmentId)

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="cqi"
        title="โครงการ CQI"
        description="Continuous Quality Improvement — ผลงานปรับปรุงคุณภาพแยกตามหน่วยงาน รายละเอียด PDCA และรางวัล"
      >
        {canWrite && <CqiProjectFormDialog />}
      </AdminEditablePageHeader>

      <div className="cqi-intro-banner relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-white to-ha-green/[0.06] p-6 lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
              <Target className="size-3.5" />
              CQI · PDCA
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground lg:text-2xl">
              ระบบติดตามผลงานปรับปรุงคุณภาพระดับโรงพยาบาล
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              เลือกหน่วยงานเพื่อดูรายการผลงาน กดเข้าสู่รายละเอียด — ชื่อผลงาน การดำเนินการ ผลลัพธ์
              และผลงานโดดเด่นที่ได้รับรางวัล
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {[
              { label: 'หน่วยงาน', value: stats.departments, icon: Building2 },
              { label: 'โครงการ', value: stats.total, icon: ClipboardCheck },
              { label: 'เสร็จแล้ว', value: stats.completed, icon: Sparkles },
              { label: 'โดดเด่น', value: stats.outstanding, icon: Award },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/80 bg-white/90 px-3 py-3 text-center shadow-sm backdrop-blur-sm"
                >
                  <Icon className="mx-auto size-4 text-primary" />
                  <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{s.value}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CQI_SYSTEM_OVERVIEW.map((item, i) => (
          <div key={item.title} className={cn(surfaceCardClass(), "flex gap-3 p-4")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={tab === t.id ? 'default' : 'ghost'}
                className="gap-1.5 rounded-lg"
                onClick={() => setTab(t.id)}
              >
                <Icon className="size-3.5" />
                {t.label}
              </Button>
            )
          })}
        </div>
        {(tab === 'departments' || tab === 'projects') && (
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อผลงาน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              className="h-9 rounded-lg border border-input px-2.5 text-sm"
            >
              <option value="">ทุกปี</option>
              {[0, 1, 2].map((o) => {
                const y = buddhistYear - o
                return (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      {tab === 'departments' && (
        <div className="space-y-8">
          {deptLoading ? (
            <p className="text-sm text-muted-foreground">กำลังโหลดหน่วยงาน...</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(deptSummary ?? []).map((s) => (
                  <CqiDepartmentCard
                    key={s.department.id}
                    summary={s}
                    selected={departmentId === s.department.id}
                    onSelect={() =>
                      setDepartmentId((prev) =>
                        prev === s.department.id ? null : s.department.id
                      )
                    }
                  />
                ))}
              </div>

              <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className={cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground')}>
                      {selectedDept
                        ? `ผลงาน CQI — ${selectedDept.department.name}`
                        : 'เลือกหน่วยงานเพื่อดูผลงาน'}
                    </h2>
                    <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-0.5")}>
                      {selectedDept
                        ? `${selectedDept.total} โครงการ · คลิกการ์ดเพื่อดูรายละเอียด`
                        : 'คลิกการ์ดหน่วยงานด้านบน'}
                    </p>
                  </div>
                  {departmentId && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDepartmentId(null)}>
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>

                {!departmentId && (
                  <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
                    เลือกหน่วยงานจากแผนด้านบน หรือสลับไปแท็บ &quot;ผลงานทั้งหมด&quot;
                  </p>
                )}

                {departmentId && (
                  <>
                    {listLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
                    {!listLoading && projects.length === 0 && (
                      <EmptyState icon={ClipboardCheck} title="ไม่มีผลงานในหน่วยงานนี้" />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {projects.map((p) => (
                        <CqiProjectCard key={p.id} project={p} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {tab === 'projects' && (
        <>
          {listLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
          {!listLoading && projects.length === 0 && (
            <EmptyState
              icon={ClipboardCheck}
              title="ไม่พบโครงการ CQI"
              description="รัน db:seed หรือเพิ่มโครงการผ่าน API"
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <CqiProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}

      {tab === 'outstanding' && <CqiOutstandingShowcase />}
    </div>
  )
}
