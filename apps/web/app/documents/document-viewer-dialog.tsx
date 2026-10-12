'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchDocumentPdf } from '@/app/documents/document-file'
import { resolveDocumentPreviewUrl } from '@/app/common/document-link'
import { showErrorToast } from '@/app/common/toast-store'

type DocumentViewerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  title: string
  fileName?: string
  versionId?: string
  source?: 'upload' | 'link'
  previewUrl?: string
  externalUrl?: string
}

const EMBED_LOAD_TIMEOUT_MS = 12_000

export function DocumentViewerDialog({
  open,
  onOpenChange,
  documentId,
  title,
  fileName,
  versionId,
  source,
  previewUrl,
  externalUrl,
}: DocumentViewerDialogProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [embedTimedOut, setEmbedTimedOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLinkDoc = source === 'link' || !!previewUrl || !!externalUrl
  const linkPreview = useMemo(
    () => resolveDocumentPreviewUrl({ previewUrl, externalUrl }),
    [previewUrl, externalUrl]
  )

  const clearEmbedTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resetState = useCallback(() => {
    clearEmbedTimeout()
    setEmbedTimedOut(false)
    setLoading(false)
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [clearEmbedTimeout])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }

    if (isLinkDoc && linkPreview.embedUrl) {
      setLoading(true)
      setEmbedTimedOut(false)
      clearEmbedTimeout()
      timeoutRef.current = setTimeout(() => {
        setEmbedTimedOut(true)
        setLoading(false)
      }, EMBED_LOAD_TIMEOUT_MS)
      return () => clearEmbedTimeout()
    }

    let cancelled = false
    setLoading(true)
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })

    fetchDocumentPdf(documentId, versionId)
      .then((blob) => {
        if (cancelled) return
        setBlobUrl(URL.createObjectURL(blob))
      })
      .catch((err) => {
        if (cancelled) return
        showErrorToast(err instanceof Error ? err.message : 'เปิดเอกสารไม่สำเร็จ')
        onOpenChange(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    open,
    documentId,
    versionId,
    onOpenChange,
    isLinkDoc,
    linkPreview.embedUrl,
    resetState,
    clearEmbedTimeout,
  ])

  const handleEmbedLoad = () => {
    clearEmbedTimeout()
    setEmbedTimedOut(false)
    setLoading(false)
  }

  const openExternal = () => {
    const target = linkPreview.openUrl ?? linkPreview.embedUrl
    if (target) window.open(target, '_blank', 'noopener,noreferrer')
  }

  const showSpinner = loading && !embedTimedOut
  const showEmbed = isLinkDoc && linkPreview.embedUrl && !embedTimedOut
  const showBlob = !isLinkDoc && blobUrl && !loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,860px)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="leading-snug">{title}</DialogTitle>
              {fileName && <DialogDescription>{fileName}</DialogDescription>}
              {isLinkDoc && linkPreview.isDrive && (
                <p className="text-xs text-muted-foreground">แสดงจาก Google Drive</p>
              )}
            </div>
            {isLinkDoc && (linkPreview.openUrl ?? linkPreview.embedUrl) && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openExternal}>
                <ExternalLink className="size-3.5" aria-hidden />
                เปิดใน Drive
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 bg-muted/20">
          {showSpinner && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85">
              <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
              <p className="text-sm text-muted-foreground">กำลังโหลดเอกสาร...</p>
            </div>
          )}

          {embedTimedOut && isLinkDoc && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
              <p className="max-w-md text-sm text-muted-foreground">
                ไม่สามารถแสดงตัวอย่างในระบบได้ — อาจเป็นเพราะสิทธิ์แชร์บน Google Drive
                (ตั้งเป็น &quot;ใครมีลิงก์ก็ดูได้&quot;) หรือไฟล์ต้องล็อกอิน Gmail ก่อน
              </p>
              <Button type="button" onClick={openExternal} className="gap-2">
                <ExternalLink className="size-4" aria-hidden />
                เปิดใน Google Drive
              </Button>
            </div>
          )}

          {showEmbed && (
            <iframe
              key={linkPreview.embedUrl ?? 'embed'}
              title={title}
              src={linkPreview.embedUrl ?? undefined}
              className="h-full w-full min-h-[70vh] border-0 bg-white"
              allow="autoplay; fullscreen"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={handleEmbedLoad}
            />
          )}

          {showBlob && (
            <iframe title={title} src={blobUrl ?? undefined} className="h-full w-full min-h-[70vh] border-0" />
          )}

          {!showSpinner && !showEmbed && !showBlob && !embedTimedOut && isLinkDoc && !linkPreview.embedUrl && (
            <div className="flex h-full min-h-[40vh] items-center justify-center px-6 text-sm text-muted-foreground">
              ไม่พบลิงก์สำหรับแสดงเอกสาร
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
