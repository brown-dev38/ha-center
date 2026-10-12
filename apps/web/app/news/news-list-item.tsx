'use client'

import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { usePermissions } from '@/hooks/use-permissions'
import { updateNews } from '@/app/news/news-api'
import { authorName, newsDetailHref, newsCategoryStyle, type NewsItem } from '@/app/news/news'
import { cn } from '@/app/common/utils'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function NewsListItem({ item }: { item: NewsItem }) {
  const { canWriteNews } = usePermissions()
  const canEdit = canWriteNews()
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: () => updateNews(item.id, { isPublished: !item.isPublished }),
    onSuccess: () => {
      showSuccessToast(item.isPublished ? 'เปลี่ยนเป็นฉบับร่างแล้ว' : 'เผยแพร่ข่าวแล้ว')
      queryClient.invalidateQueries({ queryKey: ['news'] })
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    },
  })

  const publishedIso = item.isPublished ? item.publishedAt ?? item.createdAt : null

  const detailHref = newsDetailHref(item.slug)

  return (
    <article className={cn(surfaceCardClass(), "overflow-hidden transition hover:shadow-md")}>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn('font-normal border', newsCategoryStyle(item.category.slug))}
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
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            <Link href={detailHref} className="transition hover:text-primary">
              {item.title}
            </Link>
          </h3>
          {item.excerpt && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>
          )}
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:gap-2"
          >
            อ่านรายละเอียด
            <ArrowRight className="size-4" />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3.5" />
            {authorName(item.author)}
          </span>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-56">
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

          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
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
        </div>
      </div>
    </article>
  )
}
