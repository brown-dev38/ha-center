'use client'

import { ExternalLink, Globe, Link2, Pencil, Trash2 } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { EmptyState } from '@/app/empty-state'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { Button } from '@/components/ui/button'
import { RelatedLinkFormDialog } from '@/app/links/related-link-form-dialog'
import { useDeleteRelatedLink, useRelatedLinks } from '@/hooks/use-related-links'
import { usePermissions } from '@/hooks/use-permissions'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { cn } from '@/app/common/utils'

const T = {
  confirmDelete: (title: string) => `\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E25\u0E34\u0E07\u0E01\u0E4C "${title}"?`,
  deleteSuccess: '\u0E25\u0E1A\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
  deleteFail: '\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08',
  pageTitle: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07',
  pageDesc: '\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E01 \u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E21\u0E2B\u0E32\u0E27\u0E34\u0E17\u0E22\u0E32\u0E25\u0E31\u0E22\u0E1E\u0E30\u0E40\u0E22\u0E32 \u2014 \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E19\u0E41\u0E17\u0E47\u0E1A\u0E43\u0E2B\u0E21\u0E48',
  loading: '\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E25\u0E34\u0E07\u0E01\u0E4C...',
  loadError: '\u0E42\u0E2B\u0E25\u0E14\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E48\u0E32 API \u0E17\u0E33\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48',
  emptyTitle: '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A',
  emptyDescAdmin: '\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21 \u201C\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E34\u0E07\u0E01\u0E4C\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19',
  emptyDescUser: '\u0E23\u0E2D\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E34\u0E07\u0E01\u0E4C',
  hospitalBadge: '\u0E23\u0E1E.\u0E21.\u0E1E.',
  edit: '\u0E41\u0E01\u0E49\u0E44\u0E02',
  delete: '\u0E25\u0E1A',
} as const

export default function LinksPage() {
  const { data: links, isLoading, isError } = useRelatedLinks()
  const { isAdmin } = usePermissions()
  const canManage = isAdmin()
  const deleteMutation = useDeleteRelatedLink()

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(T.confirmDelete(title))) return
    try {
      await deleteMutation.mutateAsync(id)
      showSuccessToast(T.deleteSuccess)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : T.deleteFail)
    }
  }

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader pageKey="links" title={T.pageTitle} description={T.pageDesc}>
        {canManage && <RelatedLinkFormDialog />}
      </AdminEditablePageHeader>

      {isLoading && (
        <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          {T.loading}
        </div>
      )}

      {isError && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {T.loadError}
        </p>
      )}

      {!isLoading && !isError && (links?.length ?? 0) === 0 && (
        <EmptyState
          icon={Link2}
          title={T.emptyTitle}
          description={canManage ? T.emptyDescAdmin : T.emptyDescUser}
        >
          {canManage && <RelatedLinkFormDialog />}
        </EmptyState>
      )}

      {!isLoading && links && links.length > 0 && (
        <div className="grid gap-4 sm:max-w-lg">
          {links.map((link) => (
            <div
              key={link.id}
              className={cn(surfaceCardClass(), "group relative flex h-full flex-col overflow-hidden ring-2 ring-primary/25")}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 border-b border-border/60 bg-gradient-to-r from-primary/[0.04] to-ha-green/[0.03] p-4 transition hover:bg-primary/[0.06]"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Globe className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {T.hospitalBadge}
                  </span>
                  <h3 className="font-semibold leading-snug text-foreground group-hover:text-primary">
                    {link.title}
                  </h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{link.url}</p>
                </div>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
              </a>
              {link.description && (
                <p className="flex-1 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {link.description}
                </p>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border/50 px-4 py-3">
                {link.createdAt ? (
                  <RecordTimestamp iso={link.createdAt} label="created" variant="inline" showRelative />
                ) : (
                  <span />
                )}
                {canManage && (
                  <div className="flex items-center gap-1">
                    <RelatedLinkFormDialog
                      link={link}
                      trigger={
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                          <Pencil className="size-3.5" />
                          {T.edit}
                        </Button>
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-destructive hover:bg-destructive/5"
                      onClick={() => handleDelete(link.id, link.title)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                      {T.delete}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
