'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { usePermissions } from '@/hooks/use-permissions'
import { createKmInnovation } from '@/app/km/km-api'
import { formResolver } from '@/app/common/form-resolver'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

const schema = z.object({
  title: z.string().min(1, 'กรุณาระบุชื่อนวัตกรรม'),
  innovationType: z.string().optional(),
  description: z.string().min(1, 'กรุณาระบุรายละเอียด'),
  result: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function KmAddInnovationDialog({ sessionId, fiscalYear }: { sessionId: string; fiscalYear?: number | null }) {
  const { canWriteKm } = usePermissions()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: formResolver(schema),
    defaultValues: { title: '', innovationType: 'กระบวนการ', description: '', result: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createKmInnovation({
        sessionId,
        title: values.title,
        innovationType: values.innovationType,
        description: values.description,
        result: values.result,
        year: fiscalYear ?? undefined,
      }),
    onSuccess: () => {
      showSuccessToast('บันทึกนวัตกรรมสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['km'] })
      setOpen(false)
    },
    onError: (err) => showErrorToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'),
  })

  if (!canWriteKm()) return null

  const busy = isSubmitting || mutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        เพิ่มนวัตกรรม
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกนวัตกรรม</DialogTitle>
          <DialogDescription>นวัตกรรมที่เกิดจาก KM Session นี้</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inn-title">ชื่อนวัตกรรม</Label>
            <Input id="inn-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inn-type">ประเภท</Label>
            <Input id="inn-type" placeholder="กระบวนการ / บริการ / เทคโนโลยี" {...register('innovationType')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inn-desc">รายละเอียด</Label>
            <textarea
              id="inn-desc"
              rows={4}
              {...register('description')}
              className={cn(
                'flex w-full rounded-lg border border-input px-3 py-2 text-sm',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                errors.description && 'border-destructive'
              )}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inn-result">ผลที่ได้ (ไม่บังคับ)</Label>
            <Input id="inn-result" {...register('result')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
