'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Pencil,
  Trash2,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { EmptyState } from '@/app/empty-state'
import { CqiAwardsPanel } from '@/app/cqi/cqi-awards-panel'
import { CqiPdcaTimeline } from '@/app/cqi/cqi-pdca-timeline'
import { CqiProjectFormDialog } from '@/app/cqi/cqi-project-form-dialog'
import { useCqiDetail, useDeleteCqiProject } from '@/hooks/use-cqi'
import { usePermissions } from '@/hooks/use-permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { CQI_STATUS, splitCqiParagraphs } from '@/app/cqi/cqi'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function CqiDetailView() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const { data: project, isLoading, isError } = useCqiDetail(id)
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission('cqi:write')
  const deleteMutation = useDeleteCqiProject()

  const handleDelete = async () => {
    if (!project) return
    if (!window.confirm(`ยืนยันการลบโครงการ "${project.title}"?`)) return
    try {
      await deleteMutation.mutateAsync(project.id)
      showSuccessToast('ลบโครงการสำเร็จ')
      router.push('/dashboard/cqi')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-20 text-sm text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดรายละเอียดผลงาน CQI...
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className={cn('flex flex-col gap-8 lg:gap-10')}>
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => router.push('/dashboard/cqi')}>
          <ArrowLeft className="size-4" />
          กลับ CQI
        </Button>
        <EmptyState icon={ClipboardCheck} title="ไม่พบโครงการ CQI" description="โครงการอาจถูกลบหรือไม่มีสิทธิ์เข้าถึง">
          <Link href="/dashboard/cqi" className={buttonVariants({ variant: 'default' })}>
            ไปหน้า CQI
          </Link>
        </EmptyState>
      </div>
    )
  }

  const status = CQI_STATUS[project.status] ?? {
    label: project.status,
    className: 'border-border bg-muted',
  }
  const summaryParagraphs = splitCqiParagraphs(project.description)

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/cqi" className="font-medium transition hover:text-primary">
          โครงการ CQI
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        {project.department && (
          <>
            <span>{project.department.name}</span>
            <ChevronRight className="size-3.5 shrink-0" />
          </>
        )}
        <span className="line-clamp-1 text-foreground">{project.title}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit gap-2"
          onClick={() => router.push('/dashboard/cqi')}
        >
          <ArrowLeft className="size-4" />
          กลับรายการ CQI
        </Button>
        {canWrite && (
          <div className="flex items-center gap-2">
            <CqiProjectFormDialog
              project={project}
              trigger={
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Pencil className="size-4" />
                  แก้ไข
                </Button>
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive/5"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
              ลบ
            </Button>
          </div>
        )}
      </div>

      <header
        className={cn(
          'cqi-detail-hero relative overflow-hidden rounded-2xl border',
          project.isOutstanding
            ? 'border-amber-200/70 shadow-lg shadow-amber-500/10'
            : 'border-border/80 shadow-sm'
        )}
      >
        {project.isOutstanding && (
          <>
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 left-1/3 size-48 rounded-full bg-primary/10 blur-2xl" />
          </>
        )}
        <div
          className={cn(
            'relative border-b border-border/50 px-6 py-8 lg:px-10 lg:py-10',
            project.isOutstanding
              ? 'bg-gradient-to-br from-amber-50/80 via-white to-primary/[0.04]'
              : 'bg-gradient-to-br from-primary/[0.06] via-white to-ha-green/[0.04]'
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border font-medium', status.className)}>
              {status.label}
            </Badge>
            {project.year && (
              <Badge variant="outline" className="font-normal tabular-nums">
                ปี {project.year}
              </Badge>
            )}
            {project.isOutstanding && (
              <Badge className="gap-1 border-amber-300 bg-gradient-to-r from-amber-200/80 to-amber-100 font-semibold text-amber-950">
                <Award className="size-3.5" />
                ผลงานโดดเด่น
              </Badge>
            )}
          </div>

          {project.department && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Building2 className="size-4" />
              {project.department.name}
            </p>
          )}

          <h1 className="mt-2 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-foreground lg:text-4xl">
            {project.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <User className="size-4 text-primary/70" />
              หัวหน้าโครงการ{' '}
              <span className="font-semibold text-foreground">{project.owner.name}</span>
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:max-w-2xl lg:px-10">
          <RecordTimestamp iso={project.createdAt} label="created" variant="premium" />
          {project.updatedAt !== project.createdAt && (
            <RecordTimestamp iso={project.updatedAt} label="updated" variant="compact" showRelative={false} />
          )}
        </div>
      </header>

      {summaryParagraphs.length > 0 && (
        <section className={cn(surfaceCardClass(), "p-6 lg:p-8")}>
          <h2 className={cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground')}>ภาพรวมผลงาน</h2>
          <div className="cqi-prose-block mt-4 max-w-3xl space-y-3 text-base leading-relaxed text-muted-foreground">
            {summaryParagraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-lg font-medium text-foreground' : undefined}>
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className={cn('flex flex-col gap-5')}>
        <div className="mb-2">
          <h2 className={cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground')}>วงจร PDCA</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>
            แผน · การดำเนินการ · ผลลัพธ์ · ปรับปรุงต่อเนื่อง
          </p>
        </div>
        <CqiPdcaTimeline project={project} />
      </section>

      <section className={cn('flex flex-col gap-5')}>
        <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "mb-4")}>ผลงานโดดเด่นและรางวัล</h2>
        <CqiAwardsPanel project={project} />
      </section>
    </div>
  )
}
