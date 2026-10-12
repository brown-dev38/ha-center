'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileUp, Link2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDocumentCategories, type DocumentCategory } from '@/hooks/use-document-categories'
import { fetchApiData } from '@/app/common/api-json'
import { uploadDocument } from '@/app/documents/upload-document'
import { showErrorToast } from '@/app/common/toast-store'
import { openUploadToast } from '@/app/common/upload-progress-toast'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { cn } from '@/app/common/utils'

const uploadSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุชื่อเอกสาร'),
  description: z.string().optional(),
  sectionNo: z.string().optional(),
  documentNo: z.string().optional(),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  accessLevel: z.enum(['public', 'internal', 'confidential']),
  fileUrl: z.string().optional(),
})

type UploadForm = z.infer<typeof uploadSchema>

const accessLevelLabels: Record<UploadForm['accessLevel'], string> = {
  public: 'สาธารณะ (public)',
  internal: 'ภายใน (internal)',
  confidential: 'ลับ (confidential)',
}

type UploadMode = 'link' | 'upload'

type DocumentUploadDialogProps = {
  lockedCategoryCode?: string
  defaultAccessLevel?: UploadForm['accessLevel']
  triggerLabel?: string
  /** เปิด dialog ทันทีเมื่อ mount (ใช้หน้ารูปแบบเพิ่มเอกสาร) */
  defaultOpen?: boolean
}

export function DocumentUploadDialog({
  lockedCategoryCode,
  defaultAccessLevel = 'public',
  triggerLabel = 'เพิ่มเอกสาร',
  defaultOpen = false,
}: DocumentUploadDialogProps = {}) {
  const [open, setOpen] = useState(defaultOpen)
  const [mode, setMode] = useState<UploadMode>('link')
  const [linkOnly, setLinkOnly] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dialogCategories, setDialogCategories] = useState<DocumentCategory[]>([])
  const [dialogCategoriesLoading, setDialogCategoriesLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesLoadError,
    refetch: refetchCategories,
  } = useDocumentCategories()

  const categoryOptions =
    dialogCategories.length > 0 ? dialogCategories : (categories ?? [])

  useEffect(() => {
    if (!open) return
    void refetchCategories()
    setDialogCategoriesLoading(true)
    fetchApiData<DocumentCategory[]>('documents/categories')
      .then((data) => setDialogCategories(Array.isArray(data) ? data : []))
      .catch(() => setDialogCategories([]))
      .finally(() => setDialogCategoriesLoading(false))
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { storage?: { documents?: string } }) => {
        const documentsOnlyLink = json.storage?.documents === 'link'
        setLinkOnly(documentsOnlyLink)
        if (documentsOnlyLink) setMode('link')
      })
      .catch(() => {})
  }, [open, refetchCategories])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadForm>({
    resolver: formResolver(uploadSchema),
    defaultValues: {
      title: '',
      description: '',
      sectionNo: '',
      documentNo: '',
      categoryId: lockedCategoryCode ?? '',
      accessLevel: defaultAccessLevel,
      fileUrl: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: UploadForm) => {
      if (mode === 'link') {
        if (!values.fileUrl?.trim()) throw new Error('กรุณาวางลิงก์ Google Drive')
        const message = await uploadDocument({
          ...values,
          fileUrl: values.fileUrl.trim(),
        })
        return message
      }

      if (!file) throw new Error('กรุณาเลือกไฟล์ PDF')
      const toastHandle = openUploadToast({ fileName: file.name, fileSize: file.size })
      try {
        const message = await uploadDocument({
          ...values,
          file,
          onProgress: (percent, loaded) => toastHandle.update(percent, loaded),
        })
        toastHandle.success(message)
        return message
      } catch (e) {
        toastHandle.error(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
        throw e
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      reset()
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setOpen(false)
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกเอกสารไม่สำเร็จ')
    },
  })

  const onSubmit = (values: UploadForm) => {
    mutation.mutate({ ...values, categoryId: lockedCategoryCode ?? values.categoryId })
  }

  const busy = isSubmitting || mutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        className="inline-flex shrink-0 items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Upload className="size-4" aria-hidden />
        {triggerLabel}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มเอกสาร HA</DialogTitle>
          <DialogDescription>
            แนะนำ: อัปโหลด PDF ไป Google Drive แล้ววางลิงก์แชร์ — ไม่ต้องตั้ง Service Account
          </DialogDescription>
        </DialogHeader>

        {!linkOnly && (
          <div className="flex gap-2 rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors',
                mode === 'link' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
              onClick={() => setMode('link')}
            >
              <Link2 className="size-3.5" />
              แนบลิงก์ Drive
            </button>
            <button
              type="button"
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors',
                mode === 'upload' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
              onClick={() => setMode('upload')}
            >
              <FileUp className="size-3.5" />
              อัปโหลด PDF
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">ชื่อเอกสาร</Label>
            <Input id="doc-title" {...register('title')} aria-invalid={!!errors.title} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-desc">คำอธิบาย (ไม่บังคับ)</Label>
            <Input id="doc-desc" {...register('description')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doc-section">เลขหมวด</Label>
              <Input
                id="doc-section"
                {...register('sectionNo')}
                placeholder="เช่น 1.2, 2.1"
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">รหัสหมวดย่อยตามมาตรฐาน HA</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-number">เลขหนังสือ</Label>
              <Input
                id="doc-number"
                {...register('documentNo')}
                placeholder="เช่น ฝบ 1234/2568"
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">เลขที่อ้างอิงหนังสือ / คำสั่ง</p>
            </div>
          </div>

          {!lockedCategoryCode && (
            <div className="space-y-2">
              <Label htmlFor="doc-category">หมวดหมู่</Label>
              <select
                id="doc-category"
                {...register('categoryId')}
                disabled={categoriesLoading || dialogCategoriesLoading || categoriesError}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  (errors.categoryId || categoriesError) && 'border-destructive'
                )}
              >
                <option value="">
                  {categoriesLoading || dialogCategoriesLoading
                    ? 'กำลังโหลดหมวดหมู่...'
                    : categoryOptions.length === 0
                      ? 'ไม่พบหมวดหมู่ — รัน npm run db:seed'
                      : '— เลือกหมวดหมู่ —'}
                </option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {categoriesError && (
                <div className="space-y-1">
                  <p className="text-xs text-destructive">
                    {categoriesLoadError instanceof Error
                      ? categoriesLoadError.message
                      : 'โหลดหมวดหมู่ไม่สำเร็จ'}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => refetchCategories()}>
                    ลองโหลดหมวดหมู่อีกครั้ง
                  </Button>
                </div>
              )}
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
          )}

          {FEATURE_FLAGS.documentAccessLevel && (
            <div className="space-y-2">
              <Label htmlFor="doc-access">ระดับการเข้าถึง</Label>
              <select
                id="doc-access"
                {...register('accessLevel')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {(Object.keys(accessLevelLabels) as UploadForm['accessLevel'][]).map((key) => (
                  <option key={key} value={key}>
                    {accessLevelLabels[key]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'link' ? (
            <div className="space-y-2">
              <Label htmlFor="doc-link">ลิงก์ Google Drive</Label>
              <Input
                id="doc-link"
                placeholder="https://drive.google.com/file/d/..."
                {...register('fileUrl')}
              />
              <p className="text-xs text-muted-foreground">
                อัปโหลด PDF ใน Drive → คลิกขวา แชร์ → ใครมีลิงก์ก็ดูได้ → คัดลอกลิงก์มาวาง
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="doc-file">ไฟล์ PDF</Label>
              <div
                className={cn(
                  'rounded-xl border border-dashed p-4 transition-colors',
                  file ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'
                )}
              >
                {file ? (
                  <div className="flex items-start gap-3">
                    <FileTypeIcon fileName={file.name} size="lg" className="shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · พร้อมอัปโหลด
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        เปลี่ยนไฟล์
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-2 text-center">
                    <FileUp className="size-9 text-primary/70" />
                    <p className="text-xs text-muted-foreground">เลือกไฟล์ PDF จากเครื่องของคุณ</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      เลือกไฟล์
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  id="doc-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : mode === 'link' ? 'บันทึกลิงก์' : 'บันทึกเอกสาร'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
