export type NewsCategory = {
  id: string
  name: string
  slug: string
  sortOrder?: number
  isActive?: boolean
}

export type NewsItem = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  categoryId: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category: NewsCategory
  author: { id: string; firstName: string; lastName: string }
}

export { formatDateTimeThai as formatNewsDateTime, formatDateThai as formatNewsDate } from '@/app/common/datetime'

export function authorName(author: NewsItem['author']) {
  return [author.firstName, author.lastName].filter(Boolean).join(' ') || '—'
}

const CATEGORY_STYLES: Record<string, string> = {
  announcement: 'border-sky-200 bg-sky-50 text-sky-800',
  activity: 'border-sky-200 bg-sky-50 text-sky-800',
  notice: 'border-amber-200 bg-amber-50 text-amber-900',
}

export function newsCategoryStyle(slug: string) {
  return CATEGORY_STYLES[slug] ?? 'border-primary/20 bg-primary/5 text-primary'
}

export function newsDetailHref(slug: string) {
  return `/dashboard/news/${encodeURIComponent(slug)}`
}

/** แยกย่อหน้าจากเนื้อหาข่าว (plain text) */
export function splitNewsParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** สร้าง slug จากชื่อข่าว */
export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0E00-\u0E7F-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base ? base.slice(0, 80) : `news-${Date.now()}`
}
