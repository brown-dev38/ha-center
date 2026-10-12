'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Lock,
  Play,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/app/empty-state'
import { useElearnCourse, useElearnProgress } from '@/hooks/use-elearning'
import { usePermissions } from '@/hooks/use-permissions'
import {
  CONTENT_TYPE_LABEL,
  elearnHubHref,
  elearnLessonHref,
  elearnQuizHref,
} from '@/app/elearning/elearning'
import { cn } from '@/app/common/utils'
import { GraduationCap } from 'lucide-react'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function ElearnCourseDetail() {
  const params = useParams<{ id: string }>()
  const courseId = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const { canLearnElearning } = usePermissions()
  const canLearn = canLearnElearning()

  const { data: course, isLoading, isError } = useElearnCourse(courseId)
  const { data: progress } = useElearnProgress(courseId, canLearn)

  const completedSet = new Set(progress?.completedLessons ?? [])
  const overall = progress?.overallProgress ?? 0
  const canQuiz = progress?.canTakeQuiz ?? false

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-20 text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดหลักสูตร...
      </div>
    )
  }

  if (isError || !course) {
    return (
      <EmptyState icon={GraduationCap} title="ไม่พบหลักสูตร" description="หลักสูตรอาจยังไม่เผยแพร่">
        <Link href={elearnHubHref()} className={buttonVariants()}>
          กลับ E-learning
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={elearnHubHref()} className="hover:text-primary">
          E-learning HA
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-foreground">{course.title}</span>
      </nav>

      <Button type="button" variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        กลับ
      </Button>

      <header className="elearn-course-hero overflow-hidden rounded-2xl border border-primary/15 shadow-sm">
        <div className="bg-gradient-to-br from-primary/[0.08] via-ha-purple-soft/50 to-white px-6 py-8 lg:px-10 lg:py-10">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">หลักสูตร HA</Badge>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{course.title}</h1>
          {course.description && (
            <p className="mt-3 max-w-3xl text-muted-foreground">{course.description}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="outline">ผ่านเกณฑ์ {course.passScore}%</Badge>
            <Badge variant="outline">{course.lessons.length} บทเรียน</Badge>
            {course.quiz && (
              <Badge variant="outline">{course.quiz.questionCount} ข้อสอบ</Badge>
            )}
          </div>
          {canLearn && (
            <div className="mt-6 max-w-md">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">ความคืบหน้าการเรียน</span>
                <span className="font-bold text-primary">{overall}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/80 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${overall}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {!canLearn && (
        <p className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          บัญชีผู้เข้าชม (viewer) ดูเนื้อหาได้ — การบันทึกความคืบหน้าและสอบต้องใช้บัญชีเจ้าหน้าที่ขึ้นไป
        </p>
      )}

      <section className={cn('flex flex-col gap-5')}>
        <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "flex items-center gap-2")}>
          <BookOpen className="size-5 text-primary" />
          บทเรียน — เนื้อหาพื้นฐาน HA
        </h2>
        <div className="space-y-2">
          {course.lessons.map((lesson, index) => {
            const done = completedSet.has(lesson.id)
            return (
              <Link
                key={lesson.id}
                href={elearnLessonHref(courseId, lesson.id)}
                className={cn(
                  'group flex items-center gap-4 rounded-xl border bg-white p-4 transition',
                  done ? 'border-emerald-200/60 bg-emerald-50/30' : 'border-border/80 hover:border-primary/25 hover:shadow-md'
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'
                  )}
                >
                  {done ? <CheckCircle2 className="size-5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {CONTENT_TYPE_LABEL[lesson.contentType] ?? lesson.contentType}
                    {lesson.duration ? ` · ${lesson.duration} นาที` : ''}
                  </p>
                </div>
                <Play className="size-5 shrink-0 text-muted-foreground/40 group-hover:text-primary" />
              </Link>
            )
          })}
        </div>
      </section>

      {course.quiz && (
        <section className={cn(surfaceCardClass(), "overflow-hidden")}>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex size-12 items-center justify-center rounded-xl',
                  canQuiz ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {canQuiz ? <ClipboardList className="size-6" /> : <Lock className="size-6" />}
              </div>
              <div>
                <h2 className="text-lg font-bold">{course.quiz.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {course.quiz.questionCount} ข้อ · ผ่าน {course.quiz.passScore}%
                  {!canQuiz && canLearn && ' · เรียนครบทุกบทก่อนทำแบบทดสอบ'}
                </p>
              </div>
            </div>
            {canLearn && (
              canQuiz ? (
                <Link href={elearnQuizHref(courseId)} className={buttonVariants({ className: 'gap-2' })}>
                  <ClipboardList className="size-4" />
                  เริ่มทำข้อสอบ
                </Link>
              ) : (
                <Button type="button" disabled className="gap-2">
                  <Lock className="size-4" />
                  ล็อกจนกว่าเรียนครบ
                </Button>
              )
            )}
          </div>
        </section>
      )}

      {canLearn && overall >= 100 && course.quiz && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
          <Award className="size-5 shrink-0" />
          พร้อมทำแบบทดสอบวัดผลแล้ว — สอบผ่านเพื่อรับใบรับรอง HA
        </div>
      )}
    </div>
  )
}
