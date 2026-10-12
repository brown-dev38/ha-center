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
import { createKmResult } from '@/app/km/km-api'
import type { KmResultType } from '@/app/km/km'
import { formResolver } from '@/app/common/form-resolver'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

const schema = z.object({
  type: z.enum(['system', 'innovation']),
  title: z.string().min(1, 'กรุณาระบุชื่อ'),
  description: z.string().optional(),
  systemUrl: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function KmAddResultDialog({
  sessionId,
  defaultType = 'system',
}: {
  sessionId: string
  defaultType?: KmResultType
}) {
  const { canWriteKm } = usePermissions()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: formResolver(schema),
    defaultValues: { type: defaultType, title: '', description: '', systemUrl: '' },
  })

  const type = watch('type')

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createKmResult({
        sessionId,
        type: values.type,
        title: values.title,
        description: values.description,
        systemUrl: values.systemUrl || undefined,
      }),
    onSuccess: () => {
      showSuccessToast('บันทึกผลลัพธ์ KM สำเร็จ')
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
        เพิ่มผลลัพธ์
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกผลลัพธ์จาก KM</DialogTitle>
          <DialogDescription>ระบบที่พัฒนา หรือผลลัพธ์อื่นจากการประชุม</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>ประเภท</Label>
            <select
              {...register('type')}
              className="flex h-9 w-full rounded-lg border border-input px-2.5 text-sm"
            >
              <option value="system">ระบบที่พัฒนา</option>
              <option value="innovation">ผลลัพธ์ / นวัตกรรมย่อย</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-title">ชื่อ</Label>
            <Input id="result-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-desc">รายละเอียด</Label>
            <textarea
              id="result-desc"
              rows={3}
              {...register('description')}
              className={cn(
                'flex w-full rounded-lg border border-input px-3 py-2 text-sm',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
              )}
            />
          </div>
          {type === 'system' && (
            <div className="space-y-2">
              <Label htmlFor="result-url">ลิงก์ระบบ (URL)</Label>
              <Input id="result-url" placeholder="https://..." {...register('systemUrl')} />
            </div>
          )}
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
