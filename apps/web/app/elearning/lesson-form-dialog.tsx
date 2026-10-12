'use client'

import { useEffect, useState, type ReactNode } from 'react'
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
import { useCreateLesson, useElearnLesson, useUpdateLesson } from '@/hooks/use-elearning'
import type { LessonFormValues } from '@/app/elearning/elearning-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

type LessonFormDialogProps = {
  courseId: string
  lessonId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
}

function emptyValues(): LessonFormValues {
  return { title: '', content: '', contentType: 'text', contentUrl: '', videoUrl: '', duration: null }
}

const textareaClass =
  'flex min-h-[160px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15'

export function LessonFormDialog({ courseId, lessonId, open, onOpenChange }: LessonFormDialogProps) {
  const isEdit = Boolean(lessonId)
  const [values, setValues] = useState<LessonFormValues>(emptyValues)
  const [error, setError] = useState<string | null>(null)

  const { data: detail } = useElearnLesson(open && isEdit ? courseId : undefined, lessonId)
  const createMutation = useCreateLesson(courseId)
  const updateMutation = useUpdateLesson(courseId)
  const busy = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    if (isEdit && detail) {
      setValues({
        title: detail.title ?? '',
        content: detail.content ?? '',
        contentType: detail.contentType ?? 'text',
        contentUrl: detail.contentUrl ?? '',
        videoUrl: detail.videoUrl ?? '',
        duration: detail.duration ?? null,
      })
    } else if (!isEdit) {
      setValues(emptyValues())
    }
    setError(null)
  }, [open, isEdit, detail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('กรุณาระบุชื่อบทเรียน')
      return
    }
    try {
      if (isEdit && lessonId) {
        await updateMutation.mutateAsync({ lessonId, values })
        showSuccessToast('บันทึกบทเรียนสำเร็จ')
      } else {
        await createMutation.mutateAsync(values)
        showSuccessToast('เพิ่มบทเรียนสำเร็จ')
      }
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'
      setError(message)
      showErrorToast(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขบทเรียน' : 'เพิ่มบทเรียน'}</DialogTitle>
          <DialogDescription>เนื้อหาบทเรียน รองรับข้อความ วิดีโอ หรือลิงก์ภายนอก</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">ชื่อบทเรียน *</Label>
            <Input
              id="lesson-title"
              value={values.title}
              onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-type">ประเภทเนื้อหา</Label>
              <select
                id="lesson-type"
                value={values.contentType}
                onChange={(e) => setValues((p) => ({ ...p, contentType: e.target.value }))}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm shadow-xs focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
              >
                <option value="text">ข้อความ</option>
                <option value="video">วิดีโอ</option>
                <option value="link">ลิงก์ภายนอก</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-duration">ระยะเวลา (นาที)</Label>
              <Input
                id="lesson-duration"
                type="number"
                value={values.duration ?? ''}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    duration: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {values.contentType === 'video' && (
            <div className="space-y-2">
              <Label htmlFor="lesson-video">URL วิดีโอ</Label>
              <Input
                id="lesson-video"
                value={values.videoUrl}
                onChange={(e) => setValues((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://youtu.be/... หรือลิงก์ Google Drive"
              />
            </div>
          )}

          {values.contentType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="lesson-url">ลิงก์เนื้อหา</Label>
              <Input
                id="lesson-url"
                value={values.contentUrl}
                onChange={(e) => setValues((p) => ({ ...p, contentUrl: e.target.value }))}
                placeholder="https://youtu.be/... หรือลิงก์ Google Drive"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lesson-content">เนื้อหา / คำอธิบาย</Label>
            <textarea
              id="lesson-content"
              value={values.content}
              onChange={(e) => setValues((p) => ({ ...p, content: e.target.value }))}
              className={textareaClass}
              placeholder="เนื้อหาบทเรียน (รองรับข้อความหลายย่อหน้า)"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มบทเรียน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
