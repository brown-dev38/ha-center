'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileUp, Pencil } from 'lucide-react'
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
import { useDocumentCategories } from '@/hooks/use-document-categories'
import { updateDocument } from '@/app/documents/document-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { FEATURE_FLAGS } from '@/app/common/feature-flags'
import { cn } from '@/app/common/utils'

const editSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุชื่อเอกสาร'),
  description: z.string().optional(),
  sectionNo: z.string().optional(),
  documentNo: z.string().optional(),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  accessLevel: z.enum(['public', 'internal', 'confidential']),
  changeNote: z.string().optional(),
})

type EditForm = z.infer<typeof editSchema>

const accessLevelLabels: Record<EditForm['accessLevel'], string> = {
  public: 'สาธารณะ (public)',
  internal: 'ภายใน (internal)',
  confidential: 'ลับ (confidential)',
}

export type DocumentEditData = {
  id: string
  title: string
  description?: string | null
  sectionNo?: string | null
  documentNo?: string | null
  categoryCode?: string
  accessLevel: string
  uploadedBy?: { id: string; name: string }
}

type DocumentEditDialogProps = {
  doc: DocumentEditData
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}

export function DocumentEditDialog({ doc, open, onOpenChange, trigger }: DocumentEditDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { data: categories, isLoading: categoriesLoading } = useDocumentCategories()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: formResolver(editSchema),
    defaultValues: {
      title: doc.title,
      description: doc.description ?? '',
      sectionNo: doc.sectionNo ?? '',
      documentNo: doc.documentNo ?? '',
      categoryId: doc.categoryCode ?? '',
      accessLevel: (doc.accessLevel as EditForm['accessLevel']) || 'public',
      changeNote: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: doc.title,
        description: doc.description ?? '',
        sectionNo: doc.sectionNo ?? '',
        documentNo: doc.documentNo ?? '',
        categoryId: doc.categoryCode ?? '',
        accessLevel: (doc.accessLevel as EditForm['accessLevel']) || 'public',
        changeNote: '',
      })
      setFile(null)
      setFileUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open, doc, reset])

  const mutation = useMutation({
    mutationFn: async (values: EditForm) =>
      updateDocument({
        id: doc.id,
        title: values.title,
        description: values.description,
        sectionNo: values.sectionNo ?? '',
        documentNo: values.documentNo ?? '',
        categoryId: values.categoryId,
        accessLevel: values.accessLevel,
        changeNote: values.changeNote,
        file: fileUrl.trim() ? null : file,
        fileUrl: fileUrl.trim() || undefined,
      }),
    onSuccess: (message) => {
      showSuccessToast(message)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      onOpenChange(false)
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'แก้ไขไม่สำเร็จ')
    },
  })

  const busy = isSubmitting || mutation.isPending

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-primary" />
              แก้ไขเอกสาร
            </DialogTitle>
            <DialogDescription>
              ปรับข้อมูลเมทาดาตา — วางลิงก์ Drive ใหม่หรืออัปโหลด PDF เพื่อเปลี่ยนเวอร์ชัน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-title-${doc.id}`}>ชื่อเอกสาร</Label>
              <Input id={`edit-title-${doc.id}`} {...register('title')} aria-invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-desc-${doc.id}`}>คำอธิบาย</Label>
              <Input id={`edit-desc-${doc.id}`} {...register('description')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`edit-section-${doc.id}`}>เลขหมวด</Label>
                <Input
                  id={`edit-section-${doc.id}`}
                  {...register('sectionNo')}
                  placeholder="เช่น 1.2"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-number-${doc.id}`}>เลขหนังสือ</Label>
                <Input
                  id={`edit-number-${doc.id}`}
                  {...register('documentNo')}
                  placeholder="เช่น ฝบ 1234/2568"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-category-${doc.id}`}>หมวดหมู่</Label>
              <select
                id={`edit-category-${doc.id}`}
                {...register('categoryId')}
                disabled={categoriesLoading}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  errors.categoryId && 'border-destructive'
                )}
              >
                <option value="">— เลือกหมวดหมู่ —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            {FEATURE_FLAGS.documentAccessLevel && (
              <div className="space-y-2">
                <Label htmlFor={`edit-access-${doc.id}`}>ระดับการเข้าถึง</Label>
                <select
                  id={`edit-access-${doc.id}`}
                  {...register('accessLevel')}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {(Object.keys(accessLevelLabels) as EditForm['accessLevel'][]).map((key) => (
                    <option key={key} value={key}>
                      {accessLevelLabels[key]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`edit-note-${doc.id}`}>หมายเหตุการแก้ไข (ไม่บังคับ)</Label>
              <Input id={`edit-note-${doc.id}`} {...register('changeNote')} placeholder="เช่น แก้ไขชื่อเอกสาร" />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-link-${doc.id}`}>ลิงก์ Google Drive ใหม่ (ไม่บังคับ)</Label>
              <Input
                id={`edit-link-${doc.id}`}
                placeholder="https://drive.google.com/file/d/..."
                value={fileUrl}
                onChange={(e) => {
                  setFileUrl(e.target.value)
                  if (e.target.value.trim()) setFile(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-file-${doc.id}`}>หรือไฟล์ PDF ใหม่ (ไม่บังคับ)</Label>
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors',
                  file ? 'border-ha-green/40 bg-ha-green/5' : 'border-border bg-muted/30'
                )}
              >
                <FileUp className="size-7 text-ha-green/80" />
                <p className="text-center text-xs text-muted-foreground">
                  {file ? file.name : 'เว้นว่างหากไม่เปลี่ยนไฟล์'}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  เลือกไฟล์
                </Button>
                <input
                  ref={fileInputRef}
                  id={`edit-file-${doc.id}`}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null
                    setFile(next)
                    if (next) setFileUrl('')
                  }}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
