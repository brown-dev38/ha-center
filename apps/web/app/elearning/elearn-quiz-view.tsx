'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Award, CheckCircle2, ChevronRight, XCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/app/empty-state'
import { useElearnCourse, useElearnQuiz } from '@/hooks/use-elearning'
import { usePermissions } from '@/hooks/use-permissions'
import {
  elearnCourseHref,
  elearnHubHref,
  scoreGrade,
  type ElearnQuizSubmitResult,
} from '@/app/elearning/elearning'
import { openCertificatePdf, submitElearnQuiz } from '@/app/elearning/elearning-api'
import { showErrorToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { ClipboardList } from 'lucide-react'

type AnswerMap = Record<string, 'A' | 'B' | 'C' | 'D' | undefined>

export function ElearnQuizView() {
  const params = useParams<{ id: string }>()
  const courseId = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const queryClient = useQueryClient()
  const { canLearnElearning } = usePermissions()
  const canLearn = canLearnElearning()

  const { data: course } = useElearnCourse(courseId)
  const { data: quiz, isLoading, isError, refetch } = useElearnQuiz(courseId, canLearn)

  const [answers, setAnswers] = useState<AnswerMap>({})
  const [result, setResult] = useState<ElearnQuizSubmitResult | null>(null)

  useEffect(() => {
    if (canLearn) refetch()
  }, [canLearn, refetch])

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = Object.entries(answers)
        .filter(([, v]) => v)
        .map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption: selectedOption!,
        }))
      if (payload.length !== (quiz?.questions.length ?? 0)) {
        throw new Error('กรุณาตอบให้ครบทุกข้อ')
      }
      return submitElearnQuiz(courseId, payload)
    },
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['elearning'] })
    },
    onError: (e) => showErrorToast(e instanceof Error ? e.message : 'ส่งคำตอบไม่สำเร็จ'),
  })

  if (!canLearn) {
    return (
      <EmptyState icon={ClipboardList} title="ไม่มีสิทธิ์ทำแบบทดสอบ" description="ใช้บัญชีเจ้าหน้าที่ขึ้นไป">
        <Link href={elearnCourseHref(courseId)} className={buttonVariants()}>
          กลับหลักสูตร
        </Link>
      </EmptyState>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-20 text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดข้อสอบ...
      </div>
    )
  }

  if (isError || !quiz) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="ยังทำข้อสอบไม่ได้"
        description="เรียนครบทุกบทก่อน หรือหลักสูตรยังไม่มีแบบทดสอบ"
      >
        <Link href={elearnCourseHref(courseId)} className={buttonVariants()}>
          กลับหลักสูตร
        </Link>
      </EmptyState>
    )
  }

  const passScore = quiz.passScore
  const grade = result ? scoreGrade(result.score, passScore) : null

  if (result) {
    return (
      <div className={cn(cn('flex flex-col gap-8 lg:gap-10'), "max-w-2xl")}>
        <div
          className={cn(
            'overflow-hidden rounded-2xl border text-center shadow-lg',
            result.passed
              ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-primary/[0.04]'
              : 'border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-white'
          )}
        >
          <div className="px-6 py-10 lg:px-10">
            {result.passed ? (
              <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
            ) : (
              <XCircle className="mx-auto size-16 text-rose-500" />
            )}
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              ผลการประเมิน
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums text-foreground">{result.score}%</p>
            {grade && <p className={cn('mt-1 text-lg font-semibold', grade.className)}>{grade.label}</p>}
            <p className="mt-2 text-sm text-muted-foreground">
              เกณฑ์ผ่าน {passScore}% · {result.passed ? 'ยินดีด้วย!' : 'ลองเรียนทบทวนแล้วสอบใหม่'}
            </p>
            {result.passed && result.certificate && (
              <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-4">
                <p className="flex items-center justify-center gap-2 font-semibold text-amber-950">
                  <Award className="size-5" />
                  ได้รับใบรับรอง HA
                </p>
                <p className="mt-1 text-xs text-amber-800">{result.certificate.certificateNo}</p>
                <Button
                  type="button"
                  className="mt-3 gap-2"
                  onClick={async () => {
                    try {
                      await openCertificatePdf(result.certificate!.id)
                    } catch (e) {
                      showErrorToast(e instanceof Error ? e.message : 'เปิด PDF ไม่สำเร็จ')
                    }
                  }}
                >
                  ดาวน์โหลดใบรับรอง
                </Button>
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link href={elearnHubHref()} className={buttonVariants({ variant: 'outline' })}>
                หน้า E-learning
              </Link>
              <Link href={elearnCourseHref(courseId)} className={buttonVariants()}>
                กลับหลักสูตร
              </Link>
            </div>
          </div>
        </div>
        {result.correctAnswers.length > 0 && (
          <section className="mt-8 space-y-4">
            <h2 className={cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground')}>เฉลยและคำอธิบาย</h2>
            {result.correctAnswers.map((item, i) => (
              <div key={item.questionId} className="rounded-xl border bg-white p-4 text-sm">
                <p className="font-medium text-foreground">ข้อ {i + 1}</p>
                <p className="mt-1 text-primary">คำตอบที่ถูก: {item.correctOption}</p>
                {item.explanation && (
                  <p className="mt-2 text-muted-foreground">{item.explanation}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    )
  }

  return (
    <div className={cn(cn('flex flex-col gap-8 lg:gap-10'), "max-w-3xl")}>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={elearnCourseHref(courseId)} className="hover:text-primary">
          {course?.title ?? 'หลักสูตร'}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">แบบทดสอบ</span>
      </nav>

      <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        กลับ
      </Button>

      <header className="rounded-2xl border border-primary/15 bg-gradient-to-br from-ha-purple-soft/80 to-white p-6">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {quiz.questions.length} ข้อ · ผ่านเกณฑ์ {passScore}%
        </p>
      </header>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          submitMutation.mutate()
        }}
      >
        {quiz.questions.map((q, index) => (
          <fieldset
            key={q.id}
            className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm"
          >
            <legend className="mb-4 px-1 text-base font-semibold text-foreground">
              {index + 1}. {q.question}
            </legend>
            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map((key) => (
                <label
                  key={key}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition',
                    answers[q.id] === key
                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 hover:border-primary/20 hover:bg-muted/30'
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={key}
                    checked={answers[q.id] === key}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: key }))}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="text-sm leading-relaxed">
                    <span className="font-semibold text-primary">{key}.</span> {q.options[key]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? 'กำลังตรวจคำตอบ...' : 'ส่งคำตอบและดูผลประเมิน'}
        </Button>
      </form>
    </div>
  )
}
