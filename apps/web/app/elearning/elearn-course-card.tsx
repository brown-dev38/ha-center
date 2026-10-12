'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Clock, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { elearnCourseHref, type ElearnCourseListItem } from '@/app/elearning/elearning'
import { cn } from '@/app/common/utils'

export function ElearnCourseCard({ course }: { course: ElearnCourseListItem }) {
  const progress = course.userProgress ?? 0
  const hasProgress = course.userProgress !== null

  return (
    <Link href={elearnCourseHref(course.id)} className="group block h-full">
      <article className="elearn-course-card relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-white transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8">
        <div className="elearn-course-card-accent h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-ha-green" />
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10 text-primary shadow-inner">
            <GraduationCap className="size-6" />
          </div>
          <h3 className="text-lg font-bold leading-snug text-foreground transition group-hover:text-primary">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 font-normal">
              <BookOpen className="size-3" />
              {course.lessonCount} บท
            </Badge>
            {course.durationHours != null && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Clock className="size-3" />
                {course.durationHours} ชม.
              </Badge>
            )}
            <Badge variant="outline" className="font-normal">
              ผ่าน {course.passScore}%
            </Badge>
          </div>
          {hasProgress && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">ความคืบหน้า</span>
                <span className="font-bold tabular-nums text-primary">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r from-primary to-ha-green transition-all duration-500',
                    progress >= 100 && 'from-emerald-500 to-teal-500'
                  )}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          )}
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            เข้าเรียน
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  )
}
