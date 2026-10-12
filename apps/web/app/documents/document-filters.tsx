import { Filter, LayoutGrid, List, RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DocumentCategory } from '@/hooks/use-document-categories'
import { ACCESS_LEVEL_OPTIONS } from '@/app/documents/documents'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
export type DocumentViewMode = 'table' | 'cards'

type DocumentFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  access: string
  onAccessChange: (value: string) => void
  view: DocumentViewMode
  onViewChange: (mode: DocumentViewMode) => void
  categories: DocumentCategory[]
  categoriesLoading?: boolean
  resultCount: number
  total: number
  onReset: () => void
  hasActiveFilters: boolean
}




const selectClass =
  'flex h-10 w-full min-w-0 rounded-lg border border-input bg-white px-3 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function DocumentFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  access,
  onAccessChange,
  view,
  onViewChange,
  categories,
  categoriesLoading,
  resultCount,
  total,
  onReset,
  hasActiveFilters,
}: DocumentFiltersProps) {
  return (
    <div className="surface-card space-y-4 p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="size-4 text-primary" />
          กรองและค้นหา
        </div>
        <p className="text-xs text-muted-foreground">
          แสดง <span className="font-semibold text-foreground">{resultCount}</span>
          {total > resultCount ? ` จาก ${total}` : ''} รายการ
        </p>
      </div>

      <div
        className={
          FEATURE_FLAGS.documentAccessLevel
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="doc-search" className="text-xs text-muted-foreground">
            ค้นหา
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="doc-search"
              type="search"
              placeholder="ชื่อเอกสาร เลขหมวด เลขหนังสือ..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-white pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc-category" className="text-xs text-muted-foreground">
            หมวดหมู่
          </Label>
          <select
            id="doc-category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={categoriesLoading}
            className={selectClass}
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name} ({c.documentCount})
              </option>
            ))}
          </select>
        </div>

        {FEATURE_FLAGS.documentAccessLevel && (
          <div className="space-y-1.5">
            <Label htmlFor="doc-access" className="text-xs text-muted-foreground">
              ระดับการเข้าถึง
            </Label>
            <select
              id="doc-access"
              value={access}
              onChange={(e) => onAccessChange(e.target.value)}
              className={selectClass}
            >
              {ACCESS_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">มุมมอง:</span>
          <div className="flex rounded-lg border border-border bg-white p-0.5">
            <Button
              type="button"
              size="sm"
              variant={view === 'table' ? 'default' : 'ghost'}
              className="h-8 gap-1.5 px-2.5"
              onClick={() => onViewChange('table')}
            >
              <List className="size-3.5" />
              ตาราง
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'cards' ? 'default' : 'ghost'}
              className="h-8 gap-1.5 px-2.5"
              onClick={() => onViewChange('cards')}
            >
              <LayoutGrid className="size-3.5" />
              การ์ด
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onReset}>
              <RotateCcw className="size-3.5" />
              ล้างตัวกรอง
            </Button>

          )}
        </div>
      </div>
    </div>
  )
}
