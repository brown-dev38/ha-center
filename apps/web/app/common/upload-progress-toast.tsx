'use client'

import { toast } from 'sonner'
import { CheckCircle2, Loader2, UploadCloud, XCircle } from 'lucide-react'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { cn } from '@/app/common/utils'

/** ฟอร์แมตขนาดไฟล์อ่านง่าย */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

type Status = 'uploading' | 'success' | 'error'

type CardProps = {
  fileName: string
  fileSize: number
  status: Status
  percent: number
  loaded: number
  message?: string
}

function UploadCard({ fileName, fileSize, status, percent, loaded, message }: CardProps) {
  const stateMeta: Record<Status, { label: string; iconColor: string; bar: string; ring: string }> =
    {
      uploading: {
        label: 'กำลังอัปโหลด...',
        iconColor: 'text-primary',
        bar: 'bg-gradient-to-r from-primary to-secondary',
        ring: 'ring-primary/20',
      },
      success: {
        label: 'อัปโหลดสำเร็จ',
        iconColor: 'text-emerald-600',
        bar: 'bg-emerald-500',
        ring: 'ring-emerald-200',
      },
      error: {
        label: 'อัปโหลดไม่สำเร็จ',
        iconColor: 'text-rose-600',
        bar: 'bg-rose-500',
        ring: 'ring-rose-200',
      },
    }

  const meta = stateMeta[status]

  return (
    <div
      className={cn(
        'pointer-events-auto w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18),0_4px_12px_rgba(15,23,42,0.06)] ring-1',
        meta.ring
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <FileTypeIcon fileName={fileName} size="md" className="shrink-0" />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-foreground">
              {fileName}
            </p>
            <div className={cn('flex shrink-0 items-center gap-1 text-xs font-medium', meta.iconColor)}>
              {status === 'uploading' && <Loader2 className="size-3.5 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="size-4" />}
              {status === 'error' && <XCircle className="size-4" />}
              <span>{meta.label}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {status === 'uploading'
                ? `${formatBytes(loaded)} / ${formatBytes(fileSize)}`
                : formatBytes(fileSize)}
            </span>
            <span className={cn('font-semibold tabular-nums', meta.iconColor)}>
              {status === 'success' ? '100%' : `${percent}%`}
            </span>
          </div>

          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-[width] duration-200 ease-out', meta.bar)}
              style={{ width: `${status === 'success' ? 100 : percent}%` }}
            />
          </div>

          {message && status === 'error' && (
            <p className="mt-1 text-xs leading-relaxed text-rose-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export type UploadToastHandle = {
  id: string | number
  update: (percent: number, loaded: number) => void
  success: (message?: string) => void
  error: (message: string) => void
}

/**
 * เปิด toast แสดงสถานะการอัปโหลด — คืน handle สำหรับอัปเดต progress / success / error
 *
 * วิธีใช้:
 * ```ts
 * const handle = openUploadToast({ fileName, fileSize })
 * try {
 *   await uploadWithProgress({
 *     url, body,
 *     onProgress: (p) => handle.update(p.percent, p.loaded),
 *   })
 *   handle.success('อัปโหลดสำเร็จ')
 * } catch (e) {
 *   handle.error(e.message)
 * }
 * ```
 */
export function openUploadToast({
  fileName,
  fileSize,
}: {
  fileName: string
  fileSize: number
}): UploadToastHandle {
  let percent = 0
  let loaded = 0
  let status: Status = 'uploading'
  let message: string | undefined

  const id = toast.custom(
    () => (
      <UploadCard
        fileName={fileName}
        fileSize={fileSize}
        status={status}
        percent={percent}
        loaded={loaded}
        message={message}
      />
    ),
    {
      duration: Infinity,
      unstyled: true,
      icon: <UploadCloud className="size-4 text-primary" />,
    }
  )

  const render = () => {
    toast.custom(
      () => (
        <UploadCard
          fileName={fileName}
          fileSize={fileSize}
          status={status}
          percent={percent}
          loaded={loaded}
          message={message}
        />
      ),
      {
        id,
        duration: status === 'uploading' ? Infinity : status === 'success' ? 2500 : 5500,
        unstyled: true,
      }
    )
  }

  return {
    id,
    update(p, l) {
      percent = p
      loaded = l
      render()
    },
    success(m) {
      status = 'success'
      percent = 100
      loaded = fileSize
      message = m
      render()
    },
    error(m) {
      status = 'error'
      message = m
      render()
    },
  }
}
