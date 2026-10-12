'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useElearnCourse, useElearnLesson, useElearnProgress } from '@/hooks/use-elearning'
import { usePermissions } from '@/hooks/use-permissions'
import {
  elearnCourseHref,
  elearnLessonHref,
  elearnQuizHref,
  splitLessonParagraphs,
} from '@/app/elearning/elearning'
import { completeElearnLesson } from '@/app/elearning/elearning-api'
import { resolveDocumentPreviewUrl } from '@/app/common/document-link'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

export function ElearnLessonView() {
  const params = useParams<{ id: string; lessonId: string }>()
  const courseId = typeof params.id === 'string' ? params.id : ''
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : ''
  const router = useRouter()
  const queryClient = useQueryClient()
  const { canLearnElearning } = usePermissions()
  const canLearn = canLearnElearning()

  const { data: course } = useElearnCourse(courseId)
  const { data: lesson, isLoading } = useElearnLesson(courseId, lessonId)
  const { data: progress } = useElearnProgress(courseId, canLearn)

  const lessons = course?.lessons ?? []
  const currentIndex = lessons.findIndex((l) => l.id === lessonId)
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const isDone = progress?.completedLessons.includes(lessonId)

  const completeMutation = useMutation({
    mutationFn: () => completeElearnLesson(courseId, lessonId),
    onSuccess: (data) => {
      showSuccessToast(`บันทึกเรียนจบแล้ว — ความคืบหน้า ${data.overallProgress}%`)
      queryClient.invalidateQueries({ queryKey: ['elearning'] })
    },
    onError: (e) => showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'),
  })

  if (isLoading || !lesson) {
    return (
      <div className="flex items-center gap-3 py-20 text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดบทเรียน...
      </div>
    )
  }

  const paragraphs = splitLessonParagraphs(lesson.content)
  const contentType = lesson.contentType ?? 'text'

  const videoEmbedUrl = (() => {
    const url = lesson.videoUrl?.trim()
    if (!url) return null
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)
    if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`
    return resolveDocumentPreviewUrl({ externalUrl: url }).embedUrl
  })()

  const linkPreview = resolveDocumentPreviewUrl({
    previewUrl: lesson.contentUrl,
    externalUrl: lesson.contentUrl,
  })

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={elearnCourseHref(courseId)} className="hover:text-primary">
          {course?.title ?? 'หลักสูตร'}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">บทที่ {lesson.orderNo}</span>
      </nav>

      <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => router.push(elearnCourseHref(courseId))}>
        <ArrowLeft className="size-4" />
        กลับหลักสูตร
      </Button>

      <article className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.06] to-ha-purple-soft/40 px-6 py-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">บทเรียน {lesson.orderNo}</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{lesson.title}</h1>
        </div>
        <div className="elearn-lesson-prose px-6 py-8 lg:px-10">
          {contentType === 'video' && videoEmbedUrl && (
            <div className="mb-8 overflow-hidden rounded-xl border border-border/60 bg-black/5">
              <iframe
                title={lesson.title}
                src={videoEmbedUrl}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {contentType === 'link' && lesson.contentUrl && (
            <div className="mb-8 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              {linkPreview.embedUrl ? (
                <iframe
                  title={lesson.title}
                  src={linkPreview.embedUrl}
                  className="aspect-[4/3] w-full border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <a
                    href={lesson.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    เปิดเนื้อหาบทเรียน
                  </a>
                </div>
              )}
            </div>
          )}

          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-lg font-medium text-foreground' : undefined}>
                {p}
              </p>
            ))
          ) : contentType === 'text' ? (
            <p className="text-muted-foreground">ไม่มีเนื้อหาข้อความในบทนี้</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          {canLearn && !isDone && (
            <Button
              type="button"
              className="gap-2"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              <CheckCircle2 className="size-4" />
              {completeMutation.isPending ? 'กำลังบันทึก...' : 'ทำเครื่องหมายว่าเรียนจบบทนี้'}
            </Button>
          )}
          {isDone && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              เรียนบทนี้เสร็จแล้ว
            </p>
          )}
          <div className="flex gap-2 sm:ml-auto">
            {nextLesson ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => router.push(elearnLessonHref(courseId, nextLesson.id))}
              >
                บทถัดไป
                <ArrowRight className="size-4" />
              </Button>
            ) : progress?.canTakeQuiz ? (
              <Button type="button" className="gap-2" onClick={() => router.push(elearnQuizHref(courseId))}>
                ไปทำข้อสอบ
                <ArrowRight className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}
