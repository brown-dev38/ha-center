'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateCourse, useUpdateCourse } from '@/hooks/use-elearning'
import type { CourseFormValues } from '@/app/elearning/elearning-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

type CourseLike = {
  id: string
  title: string
  description: string | null
  passScore: number
  durationHours: number | null
  isPublished: boolean
}

type CourseFormDialogProps = {
  course?: CourseLike
  trigger?: ReactNode
}

function emptyValues(): CourseFormValues {
  return { title: '', description: '', passScore: 70, durationHours: null, isPublished: false }
}

const textareaClass =
  'flex min-h-[90px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15'

export function CourseFormDialog({ course, trigger }: CourseFormDialogProps) {
  const isEdit = Boolean(course)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<CourseFormValues>(emptyValues)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateCourse()
  const updateMutation = useUpdateCourse(course?.id ?? '')
  const busy = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      setValues(
        course
          ? {
              title: course.title,
              description: course.description ?? '',
              passScore: course.passScore,
              durationHours: course.durationHours,
              isPublished: course.isPublished,
            }
          : emptyValues()
      )
      setError(null)
    }
  }, [open, course])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('กรุณาระบุชื่อหลักสูตร')
      return
    }
    try {
      if (isEdit && course) {
        await updateMutation.mutateAsync(values)
        showSuccessToast('บันทึกหลักสูตรสำเร็จ')
      } else {
        await createMutation.mutateAsync(values)
        showSuccessToast('สร้างหลักสูตรสำเร็จ')
      }
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'
      setError(message)
      showErrorToast(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button type="button" className="inline-flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          สร้างหลักสูตร
        </Button>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขหลักสูตร' : 'สร้างหลักสูตรใหม่'}</DialogTitle>
          <DialogDescription>กำหนดข้อมูลหลักสูตร E-learning HA</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-title">ชื่อหลักสูตร *</Label>
            <Input
              id="course-title"
              value={values.title}
              onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-desc">คำอธิบาย</Label>
            <textarea
              id="course-desc"
              value={values.description}
              onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
              className={textareaClass}
              placeholder="ภาพรวมเนื้อหาและสิ่งที่ผู้เรียนจะได้รับ"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-pass">เกณฑ์ผ่าน (%)</Label>
              <Input
                id="course-pass"
                type="number"
                min={0}
                max={100}
                value={values.passScore}
                onChange={(e) => setValues((p) => ({ ...p, passScore: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-duration">ระยะเวลา (ชม.)</Label>
              <Input
                id="course-duration"
                type="number"
                step="0.5"
                value={values.durationHours ?? ''}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    durationHours: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={values.isPublished}
              onChange={(e) => setValues((p) => ({ ...p, isPublished: e.target.checked }))}
              className="size-4 rounded border-input accent-primary"
            />
            เผยแพร่หลักสูตร (ให้ผู้เรียนเห็น)
          </label>

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'สร้างหลักสูตร'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
