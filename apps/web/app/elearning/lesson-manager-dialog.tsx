'use client'

import { useState, type ReactNode } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LessonFormDialog } from '@/app/elearning/lesson-form-dialog'
import { useDeleteLesson, useElearnCourse } from '@/hooks/use-elearning'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

type LessonManagerDialogProps = {
  courseId: string
  courseTitle: string
  trigger: ReactNode
}

export function LessonManagerDialog({ courseId, courseTitle, trigger }: LessonManagerDialogProps) {
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>(undefined)

  const { data: course, isLoading } = useElearnCourse(open ? courseId : undefined)
  const deleteMutation = useDeleteLesson(courseId)
  const lessons = course?.lessons ?? []

  const openCreate = () => {
    setEditingId(undefined)
    setFormOpen(true)
  }
  const openEdit = (id: string) => {
    setEditingId(id)
    setFormOpen(true)
  }
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`ลบบทเรียน "${title}"?`)) return
    try {
      await deleteMutation.mutateAsync(id)
      showSuccessToast('ลบบทเรียนสำเร็จ')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>จัดการบทเรียน</DialogTitle>
          <DialogDescription className="line-clamp-1">{courseTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{lessons.length} บทเรียน</p>
          <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="size-4" />
            เพิ่มบทเรียน
          </Button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : lessons.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีบทเรียน — กดปุ่ม “เพิ่มบทเรียน”
          </p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson, i) => (
              <li
                key={lesson.id}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.contentType}
                    {lesson.duration ? ` · ${lesson.duration} นาที` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(lesson.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-primary"
                  aria-label="แก้ไข"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(lesson.id, lesson.title)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  aria-label="ลบ"
                >
                  <Trash2 className="size-4" />
                </button>
                <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
              </li>
            ))}
          </ul>
        )}

        <LessonFormDialog
          courseId={courseId}
          lessonId={editingId}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
