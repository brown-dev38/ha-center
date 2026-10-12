export type FileTypeKind =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'archive'
  | 'text'
  | 'unknown'
  | 'none'

export type FileTypeInfo = {
  kind: FileTypeKind
  ext: string
  label: string
  /** สีพื้นหลัง gradient */
  bgClass: string
  /** สีข้อความบนไอคอน */
  textClass: string
  /** สี ring / border */
  ringClass: string
}

const EXT_MAP: Record<string, FileTypeKind> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  ppt: 'powerpoint',
  pptx: 'powerpoint',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  txt: 'text',
  md: 'text',
}

const KIND_STYLES: Record<FileTypeKind, Omit<FileTypeInfo, 'kind' | 'ext'>> = {
  pdf: {
    label: 'PDF',
    bgClass: 'from-red-500 to-red-600',
    textClass: 'text-white',
    ringClass: 'ring-red-200/80',
  },
  word: {
    label: 'Word',
    bgClass: 'from-blue-500 to-blue-600',
    textClass: 'text-white',
    ringClass: 'ring-blue-200/80',
  },
  excel: {
    label: 'Excel',
    bgClass: 'from-emerald-500 to-emerald-600',
    textClass: 'text-white',
    ringClass: 'ring-emerald-200/80',
  },
  powerpoint: {
    label: 'PowerPoint',
    bgClass: 'from-orange-500 to-orange-600',
    textClass: 'text-white',
    ringClass: 'ring-orange-200/80',
  },
  image: {
    label: 'รูปภาพ',
    bgClass: 'from-sky-500 to-cyan-600',
    textClass: 'text-white',
    ringClass: 'ring-sky-200/80',
  },
  archive: {
    label: 'บีบอัด',
    bgClass: 'from-amber-500 to-amber-600',
    textClass: 'text-white',
    ringClass: 'ring-amber-200/80',
  },
  text: {
    label: 'ข้อความ',
    bgClass: 'from-slate-500 to-slate-600',
    textClass: 'text-white',
    ringClass: 'ring-slate-200/80',
  },
  unknown: {
    label: 'ไฟล์',
    bgClass: 'from-primary/80 to-primary',
    textClass: 'text-white',
    ringClass: 'ring-primary/20',
  },
  none: {
    label: '—',
    bgClass: 'from-muted to-muted',
    textClass: 'text-muted-foreground',
    ringClass: 'ring-border',
  },
}

export function getFileExtension(fileName?: string | null): string {
  if (!fileName) return ''
  const dot = fileName.lastIndexOf('.')
  if (dot < 0) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

export function getFileTypeInfo(fileName?: string | null): FileTypeInfo {
  if (!fileName) {
    return { kind: 'none', ext: '', ...KIND_STYLES.none }
  }

  const ext = getFileExtension(fileName)
  const kind = EXT_MAP[ext] ?? 'unknown'
  const styles = KIND_STYLES[kind]

  return {
    kind,
    ext: ext ? ext.toUpperCase() : '?',
    ...styles,
  }
}
