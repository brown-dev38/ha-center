'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
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
import {
  type RelatedLink,
  type RelatedLinkInput,
  useCreateRelatedLink,
  useUpdateRelatedLink,
} from '@/hooks/use-related-links'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

type RelatedLinkFormDialogProps = {
  link?: RelatedLink
  trigger?: ReactNode
}

function emptyInput(): RelatedLinkInput {
  return { title: '', url: '', description: '', sortOrder: 0 }
}

export function RelatedLinkFormDialog({ link, trigger }: RelatedLinkFormDialogProps) {
  const isEdit = Boolean(link)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<RelatedLinkInput>(emptyInput)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateRelatedLink()
  const updateMutation = useUpdateRelatedLink()
  const busy = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      setValues(
        link
          ? {
              title: link.title,
              url: link.url,
              description: link.description ?? '',
              sortOrder: link.sortOrder,
            }
          : emptyInput()
      )
      setError(null)
    }
  }, [open, link])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim() || !values.url.trim()) {
      setError('กรุณากรอกชื่อและ URL')
      return
    }
    try {
      if (isEdit && link) {
        await updateMutation.mutateAsync({ id: link.id, input: values })
        showSuccessToast('บันทึกการแก้ไขสำเร็จ')
      } else {
        await createMutation.mutateAsync(values)
        showSuccessToast('เพิ่มลิงก์สำเร็จ')
      }
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'
      setError(message)
      showErrorToast(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button type="button" className="inline-flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          เพิ่มลิงก์
        </Button>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขลิงก์' : 'เพิ่มลิงก์หน่วยงาน'}</DialogTitle>
          <DialogDescription>ลิงก์ที่บันทึกจะแสดงในหน้าลิงก์หน่วยงานเกี่ยวข้อง</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-title">ชื่อลิงก์ *</Label>
            <Input
              id="link-title"
              value={values.title}
              onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
              placeholder="เช่น หน่วยงาน/แผนก รพ.ม.พ."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL *</Label>
            <Input
              id="link-url"
              value={values.url}
              onChange={(e) => setValues((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-desc">คำอธิบาย</Label>
            <Input
              id="link-desc"
              value={values.description}
              onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
              placeholder="รายละเอียดสั้น ๆ (ไม่บังคับ)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-order">ลำดับการแสดง</Label>
            <Input
              id="link-order"
              type="number"
              value={values.sortOrder}
              onChange={(e) => setValues((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มลิงก์'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
