'use client'

import { BookOpen, Eye, EyeOff, ListChecks, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/app/empty-state'
import { ListSkeleton } from '@/app/loading-skeletons'
import { CourseFormDialog } from '@/app/elearning/course-form-dialog'
import { LessonManagerDialog } from '@/app/elearning/lesson-manager-dialog'
import {
  useDeleteCourse,
  useElearnCourses,
  useUpdateCourse,
} from '@/hooks/use-elearning'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

function PublishToggle({
  id,
  isPublished,
}: {
  id: string
  isPublished: boolean
}) {
  const update = useUpdateCourse(id)
  const toggle = async () => {
    try {
      await update.mutateAsync({ isPublished: !isPublished })
      showSuccessToast(isPublished ? 'ซ่อนหลักสูตรแล้ว' : 'เผยแพร่หลักสูตรแล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={toggle} disabled={update.isPending}>
      {isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      {isPublished ? 'ซ่อน' : 'เผยแพร่'}
    </Button>
  )
}

export function ElearnAuthoringPanel() {
  const { data, isLoading } = useElearnCourses({ isPublished: 'all', limit: 100 })
  const deleteMutation = useDeleteCourse()
  const courses = data?.data ?? []

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`ลบหลักสูตร "${title}"? บทเรียนทั้งหมดจะถูกซ่อนด้วย`)) return
    try {
      await deleteMutation.mutateAsync(id)
      showSuccessToast('ลบหลักสูตรสำเร็จ')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          จัดการหลักสูตรและบทเรียน — หลักสูตรที่ยังไม่เผยแพร่จะไม่แสดงต่อผู้เรียน
        </p>
        <CourseFormDialog />
      </div>

      {isLoading && <ListSkeleton rows={4} />}

      {!isLoading && courses.length === 0 && (
        <EmptyState icon={BookOpen} title="ยังไม่มีหลักสูตร" description="กดปุ่ม “สร้างหลักสูตร” เพื่อเริ่มต้น">
          <CourseFormDialog />
        </EmptyState>
      )}

      {!isLoading && courses.length > 0 && (
        <div className="grid gap-3">
          {courses.map((c) => (
            <div key={c.id} className={cn(surfaceCardClass(), "flex flex-col gap-3 p-4 sm:flex-row sm:items-center")}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <span
                    className={
                      c.isPublished
                        ? 'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
                        : 'rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600'
                    }
                  >
                    {c.isPublished ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.lessonCount} บทเรียน · เกณฑ์ผ่าน {c.passScore}%
                  {c.durationHours ? ` · ${c.durationHours} ชม.` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LessonManagerDialog
                  courseId={c.id}
                  courseTitle={c.title}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="gap-1.5">
                      <ListChecks className="size-4" />
                      บทเรียน
                    </Button>
                  }
                />
                <PublishToggle id={c.id} isPublished={c.isPublished} />
                <CourseFormDialog
                  course={c}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="size-4" />
                      แก้ไข
                    </Button>
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/5"
                  onClick={() => handleDelete(c.id, c.title)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-4" />
                  ลบ
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
