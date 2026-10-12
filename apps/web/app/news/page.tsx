'use client'

import { useMemo, useState } from 'react'
import { Newspaper, Search } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { ApiStatusBadge } from '@/app/common/api-status-badge'
import { NewsCreateDialog } from '@/app/news/news-create-dialog'
import { NewsListItem } from '@/app/news/news-list-item'
import { useNewsCategories } from '@/hooks/use-news-categories'
import { useNews } from '@/hooks/use-news'
import { usePermissions } from '@/hooks/use-permissions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

type PublishFilter = 'all' | 'published' | 'draft'

export default function NewsPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all')

  const { canWriteNews, roleLabel } = usePermissions()
  const canCreate = canWriteNews()
  const { data: categories } = useNewsCategories()
  const { data: items, isLoading, isError, error } = useNews({ limit: 100 })

  const filtered = useMemo(() => {
    let list = items ?? []
    if (!canCreate) list = list.filter((n) => n.isPublished)
    if (publishFilter === 'published') list = list.filter((n) => n.isPublished)
    if (publishFilter === 'draft') list = list.filter((n) => !n.isPublished)
    if (categoryId) list = list.filter((n) => n.categoryId === categoryId)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt?.toLowerCase().includes(q) ||
          n.category.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [items, canCreate, publishFilter, categoryId, search])

  const stats = useMemo(() => {
    const all = items ?? []
    return {
      total: all.length,
      published: all.filter((n) => n.isPublished).length,
      draft: all.filter((n) => !n.isPublished).length,
    }
  }, [items])

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="news"
        title="ข่าวสาร ประกาศล่าสุด"
        description="ศูนย์กลางข่าวและประกาศ HA — ค้นหา กรอง และจัดการเวลาเผยแพร่"
      >
        <div className="flex flex-wrap items-center gap-2">
          <NewsCreateDialog />
        </div>
      </AdminEditablePageHeader>

      {canCreate && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'ทั้งหมด', value: stats.total, accent: 'text-primary' },
            { label: 'เผยแพร่แล้ว', value: stats.published, accent: 'text-emerald-600' },
            { label: 'ฉบับร่าง', value: stats.draft, accent: 'text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={cn(surfaceCardClass(), "px-4 py-3")}>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-bold tabular-nums', s.accent)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <section className={cn(surfaceCardClass(), "space-y-4 p-4")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาหัวข้อข่าว..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">ทุกหมวดหมู่</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {canCreate && (
            <div className="flex rounded-lg border border-border p-0.5">
              {(['all', 'published', 'draft'] as const).map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={publishFilter === f ? 'default' : 'ghost'}
                  onClick={() => setPublishFilter(f)}
                >
                  {f === 'all' ? 'ทั้งหมด' : f === 'published' ? 'เผยแพร่' : 'ร่าง'}
                </Button>
              ))}
            </div>
          )}
        </div>
        {roleLabel && (
          <p className="text-xs text-muted-foreground">
            บทบาท: {roleLabel} · แสดง {filtered.length} รายการ
          </p>
        )}
      </section>

      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          กำลังโหลดข่าว...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p>{error instanceof Error ? error.message : 'โหลดข่าวไม่สำเร็จ'}</p>
          <p className="mt-1 text-xs">ตรวจสอบ API: รัน npm run dev ที่รากโปรเจกต์ (พอร์ต 3000)</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="ไม่พบข่าวตามเงื่อนไข"
          description={canCreate ? 'ลองเปลี่ยนตัวกรองหรือสร้างข่าวใหม่' : 'รอผู้ดูแลเผยแพร่ข่าว'}
        >
          {canCreate && <NewsCreateDialog />}
        </EmptyState>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <NewsListItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
