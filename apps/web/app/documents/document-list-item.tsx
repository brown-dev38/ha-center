'use client'

import { DocumentRowActions } from '@/app/documents/document-row-actions'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { Badge } from '@/components/ui/badge'
import {
  DocumentNumberCell,
  DocumentSectionBadge,
} from '@/app/documents/document-reference'
import { DocumentUpdateStatus } from '@/app/documents/document-update-status'
import { MineBadge } from '@/app/common/mine-badge'
import { accessLabels, formatFileSize, type HaDocumentItem } from '@/app/documents/documents'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { cn } from '@/app/common/utils'
import { useMe } from '@/hooks/use-me'

export type DocumentListItemData = Pick<
  HaDocumentItem,
  | 'id'
  | 'title'
  | 'description'
  | 'documentNo'
  | 'sectionNo'
  | 'accessLevel'
  | 'category'
  | 'currentVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'isHidden'
  | 'uploadedBy'
>

export function DocumentListItem({ doc }: { doc: DocumentListItemData }) {
  const { data: me } = useMe()
  const isMine = !!me?.id && doc.uploadedBy?.id === me.id
  const hasFile =
    !!doc.currentVersion?.fileName || doc.currentVersion?.source === 'link'
  const fileSize = formatFileSize(doc.currentVersion?.fileSize)

  return (
    <div
      className={cn(
        surfaceCardClass(undefined, true),
        'flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between',
        doc.isHidden && 'border-dashed opacity-75',
        isMine && 'ring-1 ring-emerald-200/80'
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <FileTypeIcon fileName={doc.currentVersion?.fileName} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <DocumentSectionBadge sectionNo={doc.sectionNo} />
            <DocumentNumberCell documentNo={doc.documentNo} />
            {isMine && <MineBadge />}
            {doc.isHidden && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                ซ่อนอยู่
              </Badge>
            )}
          </div>
          <p className="font-medium leading-snug text-foreground">{doc.title}</p>
          {doc.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {doc.description}
            </p>
          )}
          <DocumentUpdateStatus
            updatedAt={doc.updatedAt}
            fallbackAt={doc.currentVersion?.createdAt ?? doc.createdAt}
            createdAt={doc.createdAt}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {doc.category?.name ?? '—'}
            {FEATURE_FLAGS.documentAccessLevel &&
              ` · ${accessLabels[doc.accessLevel] ?? doc.accessLevel}`}
            {doc.currentVersion?.fileName && (
              <span className="text-foreground/70"> · {doc.currentVersion.fileName}</span>
            )}
            {fileSize !== '—' && ` · ${fileSize}`}
          </p>
        </div>
      </div>

      <DocumentRowActions
        documentId={doc.id}
        title={doc.title}
        fileName={doc.currentVersion?.fileName}
        versionId={doc.currentVersion?.id}
        source={doc.currentVersion?.source}
        previewUrl={doc.currentVersion?.previewUrl}
        externalUrl={doc.currentVersion?.externalUrl}
        hasFile={hasFile}
        editData={{
          id: doc.id,
          title: doc.title,
          description: doc.description,
          sectionNo: doc.sectionNo,
          documentNo: doc.documentNo,
          categoryCode: doc.category?.code,
          accessLevel: doc.accessLevel,
          uploadedBy: doc.uploadedBy,
        }}
        isHidden={doc.isHidden}
      />
    </div>
  )
}
