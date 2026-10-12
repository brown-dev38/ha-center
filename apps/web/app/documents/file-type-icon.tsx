import {
  Archive,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Presentation,
} from 'lucide-react'
import { getFileTypeInfo, type FileTypeKind } from '@/app/common/file-type'
import { cn } from '@/app/common/utils'

const kindIcons: Record<FileTypeKind, typeof FileText> = {
  pdf: FileText,
  word: FileType,
  excel: FileSpreadsheet,
  powerpoint: Presentation,
  image: FileImage,
  archive: Archive,
  text: FileText,
  unknown: File,
  none: File,
}

type FileTypeIconProps = {
  fileName?: string | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeMap = {
  sm: { box: 'size-8', icon: 'size-3.5', ext: 'text-[8px]', label: 'text-[10px]' },
  md: { box: 'size-10', icon: 'size-4', ext: 'text-[9px]', label: 'text-xs' },
  lg: { box: 'size-12', icon: 'size-5', ext: 'text-[10px]', label: 'text-sm' },
}

export function FileTypeIcon({
  fileName,
  size = 'md',
  showLabel = false,
  className,
}: FileTypeIconProps) {
  const info = getFileTypeInfo(fileName)
  const s = sizeMap[size]
  const Icon = kindIcons[info.kind]
  const hasFile = info.kind !== 'none'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm ring-1',
          s.box,
          hasFile ? info.bgClass : 'bg-muted',
          hasFile ? info.textClass : 'text-muted-foreground',
          hasFile ? info.ringClass : 'ring-border',
          !hasFile && 'opacity-60'
        )}
        title={hasFile ? `${info.label} (.${info.ext})` : 'ไม่มีไฟล์'}
      >
        <Icon className={cn(s.icon, 'opacity-95')} strokeWidth={2} aria-hidden />
        {hasFile && info.ext && (
          <span
            className={cn(
              'absolute -right-1 -top-1 min-w-[1.1rem] rounded px-0.5 text-center font-bold uppercase leading-tight shadow-sm ring-1 ring-white/80',
              s.ext,
              info.kind === 'pdf'
                ? 'bg-white text-red-600'
                : info.kind === 'word'
                  ? 'bg-white text-blue-600'
                  : info.kind === 'excel'
                    ? 'bg-white text-emerald-600'
                    : info.kind === 'powerpoint'
                      ? 'bg-white text-orange-600'
                      : 'bg-white text-primary'
            )}
          >
            {info.ext}
          </span>
        )}
      </div>
      {showLabel && hasFile && (
        <span className={cn('font-medium text-muted-foreground', s.label)}>{info.label}</span>
      )}
    </div>
  )
}

/** แถวไฟล์: ไอคอน + ชื่อ + ขนาด */
export function FileTypeCell({
  fileName,
  fileSize,
  version,
}: {
  fileName?: string | null
  fileSize?: string
  version?: string
}) {
  if (!fileName) {
    return (
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <FileTypeIcon fileName={null} size="sm" />
        <span className="text-xs">ไม่มีไฟล์</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <FileTypeIcon fileName={fileName} size="sm" />
      <div className="min-w-0">
        <p className="max-w-[11rem] truncate text-sm font-medium text-foreground">{fileName}</p>
        <p className="text-xs text-muted-foreground">
          {fileSize}
          {version && ` · ${version}`}
        </p>
      </div>
    </div>
  )
}
