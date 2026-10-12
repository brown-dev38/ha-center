'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formResolver } from '@/app/common/form-resolver'
import {
  buildConsultMailto,
  CONSULT_TOPICS,
  HA_CONTACT,
} from '@/app/contact/contact'
import { useSubmitConsult } from '@/hooks/use-consult-requests'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

const schema = z.object({
  topic: z.string().min(1, 'เลือกหัวข้อปรึกษา'),
  department: z.string().min(1, 'ระบุหน่วยงาน'),
  name: z.string().min(2, 'ระบุชื่อผู้ติดต่อ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().optional(),
  urgent: z.boolean(),
  message: z.string().min(10, 'รายละเอียดอย่างน้อย 10 ตัวอักษร'),
})

type FormValues = z.infer<typeof schema>

export function ContactConsultForm() {
  const submitMutation = useSubmitConsult()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: formResolver(schema),
    defaultValues: {
      topic: '',
      department: '',
      name: '',
      email: '',
      phone: '',
      urgent: false,
      message: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await submitMutation.mutateAsync(values)
      showSuccessToast('ส่งคำขอปรึกษาสำเร็จ — ทีมงานจะติดต่อกลับภายใน 1–2 วันทำการ')
      reset()
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ส่งคำขอไม่สำเร็จ')
    }
  }

  const openMailtoFallback = () => {
    window.location.href = buildConsultMailto(getValues())
  }

  return (
    <div className={cn(surfaceCardClass(), "overflow-hidden")}>
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.07] via-white to-ha-green/[0.05] px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">ส่งคำขอปรึกษา</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              กรอกแบบฟอร์ม — คำขอจะถูกบันทึกเข้าระบบและส่งถึงทีมศูนย์ HA โดยตรง
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="consult-topic">หัวข้อที่ต้องการปรึกษา</Label>
            <select
              id="consult-topic"
              {...register('topic')}
              className={cn(
                'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm',
                errors.topic && 'border-destructive'
              )}
            >
              <option value="">เลือกหัวข้อ</option>
              {CONSULT_TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.topic && <p className="text-xs text-destructive">{errors.topic.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="consult-dept">หน่วยงาน / แผนก</Label>
            <Input id="consult-dept" placeholder="เช่น งานพัฒนาคุณภาพ" {...register('department')} />
            {errors.department && (
              <p className="text-xs text-destructive">{errors.department.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="consult-name">ชื่อ-นามสกุล</Label>
            <Input id="consult-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="consult-email">อีเมล</Label>
            <Input id="consult-email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="consult-phone">โทรศัพท์ (ไม่บังคับ)</Label>
            <Input id="consult-phone" {...register('phone')} />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <input
            type="checkbox"
            {...register('urgent')}
            className="size-4 rounded border-input accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">เรื่องเร่งด่วน</span>
            <span className="text-muted-foreground"> — ก่อนการประเมินหรือมีกำหนดส่งภายใน 3 วัน</span>
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="consult-message">รายละเอียด / คำถาม</Label>
          <textarea
            id="consult-message"
            rows={5}
            placeholder="อธิบายบริบท สิ่งที่ต้องการความช่วยเหลือ และช่วงเวลาที่สะดวกให้ติดต่อกลับ"
            {...register('message')}
            className={cn(
              'flex min-h-[7rem] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              errors.message && 'border-destructive'
            )}
          />
          {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={openMailtoFallback}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            หรือส่งทางอีเมล {HA_CONTACT.email} แทน
          </button>
          <Button
            type="submit"
            className="gap-2 sm:shrink-0"
            disabled={isSubmitting || submitMutation.isPending}
          >
            <Send className="size-4" />
            {submitMutation.isPending ? 'กำลังส่ง...' : 'ส่งคำขอปรึกษา'}
          </Button>
        </div>
      </form>
    </div>
  )
}
