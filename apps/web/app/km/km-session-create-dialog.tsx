'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus, Upload } from 'lucide-react'
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
import { useMe } from '@/hooks/use-me'
import { usePermissions } from '@/hooks/use-permissions'
import { createKmSession } from '@/app/km/km-api'
import { formResolver } from '@/app/common/form-resolver'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

type ReportMode = 'link' | 'upload'

const schema = z.object({
  title: z.string().min(1, 'กรุณาระบุหัวข้อ'),
  sessionDate: z.string().min(1, 'กรุณาเลือกวันที่'),
  fiscalYear: z.coerce.number().min(2500, 'ปีไม่ถูกต้อง'),
  description: z.string().optional(),
  location: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function KmSessionCreateDialog() {
  const { canWriteKm } = usePermissions()
  const { data: me } = useMe()
  const [open, setOpen] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [reportUrl, setReportUrl] = useState('')
  const [reportMode, setReportMode] = useState<ReportMode>('link')
  const [linkOnly, setLinkOnly] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!open) return
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { storage?: { km?: string } }) => {
        const kmLinkOnly = json.storage?.km === 'link'
        setLinkOnly(kmLinkOnly)
        if (kmLinkOnly) setReportMode('link')
      })
      .catch(() => {})
  }, [open])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: formResolver(schema),
    defaultValues: {
      title: '',
      sessionDate: new Date().toISOString().slice(0, 16),
      fiscalYear: new Date().getFullYear() + 543,
      description: '',
      location: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createKmSession({
        ...values,
        facilitatorId: me!.id,
        sessionDate: new Date(values.sessionDate).toISOString(),
        file: reportMode === 'upload' ? (pdfFile ?? undefined) : undefined,
        fileUrl: reportMode === 'link' ? reportUrl.trim() || undefined : undefined,
      }),
    onSuccess: () => {
      showSuccessToast('บันทึก KM Session สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['km'] })
      reset()
      setPdfFile(null)
      setReportUrl('')
      setOpen(false)
    },
    onError: (err) => showErrorToast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'),
  })

  if (!canWriteKm() || !me?.id) return null

  const busy = isSubmitting || mutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        บันทึก KM ครั้งใหม่
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>บันทึกรายงานการประชุม (KM Session)</DialogTitle>
          <DialogDescription>
            บันทึกหลังจัดประชุม KM — แนบ PDF รายงานได้ (ไม่บังคับ)
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="km-title">หัวข้อการประชุม / KM</Label>
            <Input id="km-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="km-date">วันที่จัด</Label>
              <Input id="km-date" type="datetime-local" {...register('sessionDate')} />
              {errors.sessionDate && (
                <p className="text-xs text-destructive">{errors.sessionDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="km-year">ปี (พ.ศ.)</Label>
              <Input id="km-year" type="number" {...register('fiscalYear')} />
              {errors.fiscalYear && (
                <p className="text-xs text-destructive">{errors.fiscalYear.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="km-location">สถานที่ (ไม่บังคับ)</Label>
            <Input id="km-location" {...register('location')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="km-desc">สรุป (ไม่บังคับ)</Label>
            <textarea
              id="km-desc"
              rows={3}
              {...register('description')}
              className={cn(
                'flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>รายงานการประชุม (ไม่บังคับ)</Label>
            {!linkOnly && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={reportMode === 'link' ? 'default' : 'outline'}
                  className="gap-2"
                  onClick={() => setReportMode('link')}
                >
                  <Link2 className="size-4" />
                  แนบลิงก์ Drive
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={reportMode === 'upload' ? 'default' : 'outline'}
                  className="gap-2"
                  onClick={() => setReportMode('upload')}
                >
                  <Upload className="size-4" />
                  อัปโหลด PDF
                </Button>
              </div>
            )}
            {reportMode === 'link' ? (
              <Input
                id="km-report-url"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
              />
            ) : (
              <Input
                id="km-pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
            )}
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
