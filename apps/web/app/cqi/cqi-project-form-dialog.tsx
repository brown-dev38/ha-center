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
import { useCqiDepartmentOptions, useCreateCqiProject, useUpdateCqiProject } from '@/hooks/use-cqi'
import type { CqiDetail } from '@/app/cqi/cqi'
import type { CqiFormValues } from '@/app/cqi/cqi-api'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

const STATUS_OPTIONS = [
  { value: 'active', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'draft', label: 'ร่าง' },
  { value: 'on_hold', label: 'พักชั่วคราว' },
]

const PDCA_FIELDS: { key: keyof CqiFormValues; label: string; placeholder: string }[] = [
  { key: 'planDetail', label: 'Plan — วางแผน', placeholder: 'ปัญหา/โอกาสพัฒนา และแนวทางที่วางแผนไว้' },
  { key: 'doDetail', label: 'Do — ดำเนินการ', placeholder: 'กิจกรรมที่ลงมือปฏิบัติ' },
  { key: 'checkDetail', label: 'Check — ผลลัพธ์', placeholder: 'ผลการวัด/ประเมินเทียบเป้าหมาย' },
  { key: 'actDetail', label: 'Act — ปรับปรุงต่อเนื่อง', placeholder: 'มาตรฐานใหม่และการขยายผล' },
]

function emptyForm(): CqiFormValues {
  return {
    title: '',
    description: '',
    departmentId: '',
    year: new Date().getFullYear() + 543,
    status: 'active',
    planDetail: '',
    doDetail: '',
    checkDetail: '',
    actDetail: '',
    isOutstanding: false,
    awardName: '',
  }
}

function fromDetail(project: CqiDetail): CqiFormValues {
  return {
    title: project.title,
    description: project.description ?? '',
    departmentId: project.department?.id ?? '',
    year: project.year,
    status: project.status,
    planDetail: project.pdca.plan ?? '',
    doDetail: project.pdca.do ?? '',
    checkDetail: project.pdca.check ?? '',
    actDetail: project.pdca.act ?? '',
    isOutstanding: project.isOutstanding,
    awardName: project.awardName ?? '',
  }
}

type CqiProjectFormDialogProps = {
  /** ถ้ามี = โหมดแก้ไข */
  project?: CqiDetail
  trigger?: ReactNode
}

const textareaClass =
  'flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15'

export function CqiProjectFormDialog({ project, trigger }: CqiProjectFormDialogProps) {
  const isEdit = Boolean(project)
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<CqiFormValues>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const { data: departments } = useCqiDepartmentOptions(open)
  const createMutation = useCreateCqiProject()
  const updateMutation = useUpdateCqiProject(project?.id ?? '')

  useEffect(() => {
    if (open) {
      setValues(project ? fromDetail(project) : emptyForm())
      setError(null)
    }
  }, [open, project])

  const set = <K extends keyof CqiFormValues>(key: K, value: CqiFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const busy = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('กรุณาระบุชื่อโครงการ')
      return
    }
    try {
      if (isEdit && project) {
        await updateMutation.mutateAsync(values)
        showSuccessToast('บันทึกการแก้ไขสำเร็จ')
      } else {
        await createMutation.mutateAsync(values)
        showSuccessToast('สร้างโครงการ CQI สำเร็จ')
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
          เพิ่มโครงการ CQI
        </Button>
      )}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขโครงการ CQI' : 'เพิ่มโครงการ CQI'}</DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดผลงานปรับปรุงคุณภาพและขั้นตอน PDCA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cqi-title">ชื่อโครงการ *</Label>
            <Input
              id="cqi-title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="ชื่อผลงาน CQI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cqi-desc">รายละเอียด/บทคัดย่อ</Label>
            <textarea
              id="cqi-desc"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              className={textareaClass}
              placeholder="สรุปที่มา ความสำคัญ และผลลัพธ์โดยรวม"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cqi-dept">หน่วยงาน</Label>
              <select
                id="cqi-dept"
                value={values.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm shadow-xs focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
              >
                <option value="">— ไม่ระบุ —</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cqi-year">ปี (พ.ศ.)</Label>
              <Input
                id="cqi-year"
                type="number"
                value={values.year ?? ''}
                onChange={(e) => set('year', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cqi-status">สถานะ</Label>
              <select
                id="cqi-status"
                value={values.status}
                onChange={(e) => set('status', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm shadow-xs focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">ขั้นตอน PDCA</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PDCA_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`cqi-${f.key}`} className="text-xs">
                    {f.label}
                  </Label>
                  <textarea
                    id={`cqi-${f.key}`}
                    value={values[f.key] as string}
                    onChange={(e) => set(f.key, e.target.value as CqiFormValues[typeof f.key])}
                    className={cn(textareaClass, 'min-h-[70px] bg-white')}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={values.isOutstanding}
                onChange={(e) => set('isOutstanding', e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              ผลงานโดดเด่น / ได้รับรางวัล
            </label>
            {values.isOutstanding && (
              <Input
                value={values.awardName}
                onChange={(e) => set('awardName', e.target.value)}
                placeholder="ชื่อรางวัล (ถ้ามี)"
                className="flex-1"
              />
            )}
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
              {busy ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'สร้างโครงการ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
