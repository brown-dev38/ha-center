'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formResolver } from '@/app/common/form-resolver'
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
import { useNewsCategories } from '@/hooks/use-news-categories'
import { usePermissions } from '@/hooks/use-permissions'
import { createNews } from '@/app/news/news-api'
import { slugifyTitle } from '@/app/news/news'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'

const createSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุหัวข้อข่าว'),
  slug: z.string().min(1, 'กรุณาระบุ slug'),
  content: z.string().min(1, 'กรุณาระบุเนื้อหา'),
  excerpt: z.string().optional(),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  isPublished: z.boolean(),
})

type CreateForm = z.infer<typeof createSchema>

export function NewsCreateDialog() {
  const { canWriteNews } = usePermissions()
  const [open, setOpen] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const queryClient = useQueryClient()
  const { data: categories, isLoading: categoriesLoading } = useNewsCategories()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: formResolver(createSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      categoryId: '',
      isPublished: false,
    },
  })

  const title = watch('title')

  useEffect(() => {
    if (!slugTouched && title) {
      setValue('slug', slugifyTitle(title))
    }
  }, [title, slugTouched, setValue])

  const mutation = useMutation({
    mutationFn: createNews,
    onSuccess: () => {
      showSuccessToast('สร้างข่าวสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['news'] })
      reset()
      setSlugTouched(false)
      setOpen(false)
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'สร้างข่าวไม่สำเร็จ')
    },
  })

  if (!canWriteNews()) return null

  const busy = isSubmitting || mutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="inline-flex shrink-0 items-center gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        สร้างข่าว
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สร้างข่าว / ประกาศ</DialogTitle>
          <DialogDescription>
            เฉพาะผู้มีสิทธิ์ news:write (admin / qa_manager) — บันทึกเป็นฉบับร่างหรือเผยแพร่ทันที
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="news-title">หัวข้อ</Label>
            <Input id="news-title" {...register('title')} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="news-slug">Slug (URL)</Label>
            <Input
              id="news-slug"
              {...register('slug', {
                onChange: () => setSlugTouched(true),
              })}
              aria-invalid={!!errors.slug}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="news-category">หมวดหมู่</Label>
            <select
              id="news-category"
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
                  {c.name}
                </option>
              ))}
            </select>
            {!categoriesLoading && (categories ?? []).length === 0 && (
              <p className="text-xs text-amber-700">
                ยังไม่มีหมวดหมู่ข่าว — รัน seed API: <code className="text-[10px]">bun run db:seed</code>
              </p>
            )}
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="news-excerpt">สรุปย่อ (ไม่บังคับ)</Label>
            <Input id="news-excerpt" {...register('excerpt')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="news-content">เนื้อหา</Label>
            <textarea
              id="news-content"
              rows={6}
              {...register('content')}
              className={cn(
                'flex min-h-[8rem] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                errors.content && 'border-destructive'
              )}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register('isPublished')} className="size-4 rounded border-input" />
            เผยแพร่ทันที
          </label>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'กำลังบันทึก...' : 'บันทึกข่าว'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
