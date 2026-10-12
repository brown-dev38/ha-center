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
import { Button } from '@/components/ui/button'
import { resolveDocumentPreviewUrl } from '@/app/common/document-link'

type ExternalLinkViewerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fileName?: string
  previewUrl?: string
  externalUrl?: string
}

const EMBED_LOAD_TIMEOUT_MS = 12_000

export function ExternalLinkViewerDialog({
  open,
  onOpenChange,
  title,
  fileName,
  previewUrl,
  externalUrl,
}: ExternalLinkViewerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [embedTimedOut, setEmbedTimedOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  }, [clearEmbedTimeout])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }

    if (linkPreview.embedUrl) {
      setLoading(true)
      setEmbedTimedOut(false)
      clearEmbedTimeout()
      timeoutRef.current = setTimeout(() => {
        setEmbedTimedOut(true)
        setLoading(false)
      }, EMBED_LOAD_TIMEOUT_MS)
    } else {
      resetState()
    }

    return clearEmbedTimeout
  }, [open, linkPreview.embedUrl, clearEmbedTimeout, resetState])

  const handleIframeLoad = () => {
    clearEmbedTimeout()
    setLoading(false)
    setEmbedTimedOut(false)
  }

  const openUrl = linkPreview.openUrl ?? externalUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle className="line-clamp-2 pr-8">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {fileName ? `เปิดไฟล์ ${fileName}` : 'เปิดเอกสารจากลิงก์ภายนอก'}
          </DialogDescription>
          {openUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-fit gap-2"
              onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="size-4" />
              {linkPreview.isDrive ? 'เปิดใน Google Drive' : 'เปิดลิงก์ต้นทาง'}
            </Button>
          )}
        </DialogHeader>

        <div className="relative min-h-[60vh] flex-1 bg-muted/30">
          {loading && !embedTimedOut && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">กำลังโหลดเอกสาร...</p>
            </div>
          )}

          {embedTimedOut && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                โหลดในหน้าเว็บไม่สำเร็จ — อาจต้องลงชื่อเข้าใช้ Google หรือสิทธิ์แชร์ไฟล์จำกัด
              </p>
              {openUrl && (
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="size-4" />
                  เปิดในแท็บใหม่
                </Button>
              )}
            </div>
          )}

          {linkPreview.embedUrl ? (
            <iframe
              title={title}
              src={linkPreview.embedUrl}
              className="h-[60vh] w-full border-0"
              onLoad={handleIframeLoad}
              allow="autoplay"
            />
          ) : (
            <div className="flex h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
              ไม่มีลิงก์สำหรับแสดงตัวอย่าง
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
