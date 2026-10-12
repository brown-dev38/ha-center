'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formResolver } from '@/app/common/form-resolver'
import { fetchApiData } from '@/app/common/api-json'
import { cn } from '@/app/common/utils'
import {
  buildQualityDocumentCode,
  buildQualityDocumentDescription,
} from '@/app/documents/document-quality-levels'
import { QualityLevelSelect, useQualityDocumentLevels } from '@/app/documents/quality-level-select'
import { uploadDocument } from '@/app/documents/upload-document'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { openUploadToast } from '@/app/common/upload-progress-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DepartmentOption = {
  id: string
  code: string
  name: string
}

const formSchema = z.object({
  departmentCode: z.string().min(1, 'กรุณาเลือกหน่วยงาน/ทีม'),
  levelCode: z.string().min(1, 'กรุณาเลือกระดับเอกสารคุณภาพ'),
  title: z.string().min(1, 'กรุณาระบุชื่อเอกสาร'),
  effectiveDate: z.string().optional(),
  otherDepartmentCodes: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

function FieldShell({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export function DocumentsAddForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [linkOnly, setLinkOnly] = useState(false)
  const [fileUrl, setFileUrl] = useState('')

  const { data: qualityLevels = [] } = useQualityDocumentLevels()
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['documents', 'departments'],
    queryFn: () => fetchApiData<DepartmentOption[]>('documents/departments'),
  })

  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { storage?: { documents?: string } }) => {
        setLinkOnly(json.storage?.documents === 'link')
      })
      .catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: formResolver(formSchema),
    defaultValues: {
      departmentCode: '',
      levelCode: '',
      title: '',
      effectiveDate: '',
      otherDepartmentCodes: [],
    },
  })

  const departmentCode = useWatch({ control, name: 'departmentCode' })
  const levelCode = useWatch({ control, name: 'levelCode' })
  const effectiveDate = useWatch({ control, name: 'effectiveDate' })
  const otherDepartmentCodes = useWatch({ control, name: 'otherDepartmentCodes' }) ?? []

  const generatedCode = useMemo(
    () =>
      buildQualityDocumentCode({
        departmentCode: departmentCode ?? '',
        levelCode: levelCode ?? '',
        effectiveDate: effectiveDate || undefined,
      }),
    [departmentCode, levelCode, effectiveDate]
  )

  const otherDeptOptions = useMemo(
    () => departments.filter((d) => d.code !== departmentCode),
    [departments, departmentCode]
  )

  const toggleOtherDepartment = (code: string) => {
    const next = otherDepartmentCodes.includes(code)
      ? otherDepartmentCodes.filter((c) => c !== code)
      : [...otherDepartmentCodes, code]
    setValue('otherDepartmentCodes', next, { shouldDirty: true })
  }

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const code = buildQualityDocumentCode({
        departmentCode: values.departmentCode,
        levelCode: values.levelCode,
        effectiveDate: values.effectiveDate || undefined,
      })
      if (!code) throw new Error('ไม่สามารถสร้างรหัสเอกสารได้')

      const selectedOther = departments
        .filter((d) => (values.otherDepartmentCodes ?? []).includes(d.code))
        .map((d) => d.name)

      const description = buildQualityDocumentDescription({
        effectiveDate: values.effectiveDate || undefined,
        otherDepartments: selectedOther,
      })

      if (linkOnly) {
        if (!fileUrl.trim()) throw new Error('กรุณาวางลิงก์ Google Drive')
        return uploadDocument({
          title: values.title.trim(),
          description,
          documentNo: code,
          sectionNo: values.departmentCode,
          categoryId: values.levelCode,
          accessLevel: 'internal',
          fileUrl: fileUrl.trim(),
        })
      }

      if (!file) throw new Error('กรุณาเลือกไฟล์แนบ')
      const toastHandle = openUploadToast({ fileName: file.name, fileSize: file.size })
      try {
        const message = await uploadDocument({
          title: values.title.trim(),
          description,
          documentNo: code,
          sectionNo: values.departmentCode,
          categoryId: values.levelCode,
          accessLevel: 'internal',
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
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      showSuccessToast(message || 'บันทึกเอกสารแล้ว')
      router.push('/dashboard/documents')
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกเอกสารไม่สำเร็จ')
    },
  })

  const onSubmit = (values: FormValues) => {
    setFileError(null)
    if (!linkOnly && !file) {
      setFileError('กรุณาเลือกไฟล์แนบ')
      return
    }
    mutation.mutate(values)
  }

  const busy = isSubmitting || mutation.isPending

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
          เพิ่มเอกสารคุณภาพ
        </h1>
        <nav className="text-sm text-sky-700">
          <Link href="/dashboard/documents" className="hover:underline">
            เอกสารคุณภาพ
          </Link>
          <span className="mx-1.5 text-slate-400">/</span>
          <span className="text-slate-600">เพิ่มเอกสารคุณภาพ</span>
        </nav>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <p className="mb-5 text-sm text-slate-700">
          เลือกรายการเพื่อสร้างรหัส{' '}
          <span className="font-medium text-red-600">(โปรดตรวจสอบความถูกต้อง)</span>
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldShell
            label="หน่วยงาน/ทีม"
            htmlFor="departmentCode"
            error={errors.departmentCode?.message}
          >
            <select
              id="departmentCode"
              className={selectClass}
              disabled={departmentsLoading || busy}
              {...register('departmentCode')}
            >
              <option value="">เลือกหน่วยงาน/ทีม</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </FieldShell>

          <FieldShell
            label="ระดับเอกสารคุณภาพ"
            htmlFor="levelCode"
            error={errors.levelCode?.message}
          >
            <QualityLevelSelect
              id="levelCode"
              value={levelCode ?? ''}
              levels={qualityLevels}
              disabled={busy}
              invalid={Boolean(errors.levelCode)}
              onChange={(code) =>
                setValue('levelCode', code, { shouldValidate: true, shouldDirty: true })
              }
            />
          </FieldShell>

          <FieldShell label="รหัส" htmlFor="documentCode">
            <Input
              id="documentCode"
              readOnly
              value={generatedCode}
              placeholder="--- รอการสร้างรหัส ---"
              className="bg-slate-50 font-mono text-[13px] text-slate-700"
            />
          </FieldShell>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <FieldShell label="ชื่อเอกสาร" htmlFor="title" error={errors.title?.message}>
            <Input id="title" disabled={busy} {...register('title')} />
          </FieldShell>

          <FieldShell label="วันบังคับใช้" htmlFor="effectiveDate">
            <Input
              id="effectiveDate"
              type="date"
              disabled={busy}
              {...register('effectiveDate')}
            />
          </FieldShell>

          <FieldShell label="ไฟล์แนบ" htmlFor="attachment" error={fileError ?? undefined}>
            {linkOnly ? (
              <Input
                id="attachment"
                type="url"
                placeholder="วางลิงก์ Google Drive"
                value={fileUrl}
                disabled={busy}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            ) : (
              <div className="flex h-10 overflow-hidden rounded-md border border-input bg-background">
                <input
                  ref={fileInputRef}
                  id="attachment"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null
                    setFile(next)
                    setFileError(null)
                  }}
                />
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-3 text-left text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  {file?.name || 'เลือกไฟล์แนบ'}
                </button>
                <button
                  type="button"
                  className="shrink-0 border-l border-input bg-slate-50 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  Browse
                </button>
              </div>
            )}
          </FieldShell>
        </div>

        <div className="mt-4 space-y-2">
          <FieldShell label="หน่วยงานอื่นที่ใช้" htmlFor="otherDepartments">
            <select
              id="otherDepartments"
              className={selectClass}
              disabled={busy || !departmentCode}
              value=""
              onChange={(e) => {
                const code = e.target.value
                if (code) toggleOtherDepartment(code)
              }}
            >
              <option value="">เลือกหน่วยงาน</option>
              {otherDeptOptions.map((d) => (
                <option key={d.id} value={d.code} disabled={otherDepartmentCodes.includes(d.code)}>
                  {d.name}
                </option>
              ))}
            </select>
          </FieldShell>
          {otherDepartmentCodes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {otherDepartmentCodes.map((code) => {
                const dept = departments.find((d) => d.code === code)
                return (
                  <button
                    key={code}
                    type="button"
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-700 hover:bg-slate-100"
                    onClick={() => toggleOtherDepartment(code)}
                    disabled={busy}
                  >
                    {dept?.name ?? code} ×
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            disabled={busy}
            className="bg-[#2563eb] px-5 hover:bg-[#1d4ed8]"
          >
            {busy ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}
          </Button>
        </div>
      </form>
    </div>
  )
}
