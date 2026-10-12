'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Eye,
  EyeOff,
  Newspaper,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { EmptyState } from '@/app/empty-state'
import { NewsContent } from '@/app/news/news-content'
import { useNewsDetail } from '@/hooks/use-news-detail'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDateLongThai } from '@/app/common/datetime'
import { updateNews } from '@/app/news/news-api'
import { authorName, newsCategoryStyle } from '@/app/news/news'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

export function NewsDetailView() {
  const params = useParams<{ slug: string }>()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const router = useRouter()
  const queryClient = useQueryClient()
  const { canWriteNews } = usePermissions()
  const canEdit = canWriteNews()

  const { data: item, isLoading, isError, error } = useNewsDetail(slug)

  const toggleMutation = useMutation({
    mutationFn: () => updateNews(item!.id, { isPublished: !item!.isPublished }),
    onSuccess: () => {
      showSuccessToast(item!.isPublished ? 'เปลี่ยนเป็นฉบับร่างแล้ว' : 'เผยแพร่ข่าวแล้ว')
      queryClient.invalidateQueries({ queryKey: ['news'] })
      queryClient.invalidateQueries({ queryKey: ['news', 'detail', slug] })
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดรายละเอียดข่าว...
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className={cn('flex flex-col gap-8 lg:gap-10')}>
        <Button type="button" variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          กลับรายการข่าว
        </Button>
        <EmptyState
          icon={Newspaper}
          title="ไม่พบข่าวนี้"
          description={error instanceof Error ? error.message : 'ข่าวอาจถูกลบหรือยังไม่เผยแพร่'}
        >
          <Link href="/dashboard/news" className={buttonVariants({ variant: 'default' })}>
            ไปหน้าข่าวสาร
          </Link>
        </EmptyState>
      </div>
    )
  }

  const publishedIso = item.isPublished ? item.publishedAt ?? item.createdAt : null
  const displayDate = publishedIso ?? item.createdAt
  const dateLong = formatDateLongThai(displayDate)

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/news" className="font-medium transition hover:text-primary">
          ข่าวสาร ประกาศล่าสุด
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-foreground/80">{item.category.name}</span>
      </nav>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-2 text-muted-foreground hover:text-primary"
        onClick={() => router.push('/dashboard/news')}
      >
        <ArrowLeft className="size-4" />
        กลับรายการข่าว
      </Button>

      <article className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
        <header className="relative border-b border-border/60 bg-gradient-to-br from-primary/[0.07] via-white to-ha-green/[0.05] px-6 py-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.42_0.1_240/0.08),transparent_55%)]" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('border font-medium', newsCategoryStyle(item.category.slug))}
              >
                {item.category.name}
              </Badge>
              <Badge
                variant={item.isPublished ? 'default' : 'secondary'}
                className={
                  item.isPublished
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }
              >
                {item.isPublished ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
              </Badge>
            </div>

            <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight text-foreground lg:text-3xl">
              {item.title}
            </h1>

            {item.excerpt && (
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground lg:text-lg">
                {item.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <User className="size-4 text-primary/70" />
                <span>
                  โดย <span className="font-medium text-foreground">{authorName(item.author)}</span>
                </span>
              </span>
              <span className="inline-flex items-center gap-2" title={dateLong}>
                <CalendarDays className="size-4 text-primary/70" />
                <span>{dateLong}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1fr_17rem] lg:gap-10 lg:px-10 lg:py-10">
          <div className="min-w-0">
            <NewsContent content={item.content} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                ข้อมูลเผยแพร่
              </p>
              {publishedIso ? (
                <RecordTimestamp
                  iso={publishedIso}
                  label="published"
                  variant="premium"
                  secondaryIso={item.createdAt}
                  secondaryLabel="created"
                />
              ) : (
                <RecordTimestamp iso={item.createdAt} label="created" variant="premium" />
              )}
              <RecordTimestamp iso={item.updatedAt} label="updated" variant="compact" showRelative={false} />
            </div>

            {canEdit && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate()}
              >
                {item.isPublished ? (
                  <>
                    <EyeOff className="size-4" />
                    ยกเลิกเผยแพร่
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    เผยแพร่ทันที
                  </>
                )}
              </Button>
            )}
          </aside>
        </div>
      </article>
    </div>
  )
}
