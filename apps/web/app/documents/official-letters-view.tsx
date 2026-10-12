'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { openUploadToast } from '@/app/common/upload-progress-toast'
import { DocumentRowActions } from '@/app/documents/document-row-actions'
import type { HaDocumentItem } from '@/app/documents/documents'
import { uploadDocument } from '@/app/documents/upload-document'
import { useDocuments } from '@/hooks/use-documents'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const LETTER_KINDS = [
  { value: 'receive', label: 'หนังสือรับ' },
  { value: 'send', label: 'หนังสือส่ง' },
] as const

type LetterKind = (typeof LETTER_KINDS)[number]['value']

function letterKindLabel(doc: HaDocumentItem): string {
  const known = LETTER_KINDS.find((item) => item.value === doc.sectionNo)
  if (known) return known.label
  if (doc.description === 'หนังสือรับ' || doc.description === 'หนังสือส่ง') return doc.description
  return '—'
}

type OfficialLettersViewProps = {
  pageKey: string
  title: string
  description: string
  formTitle: string
  categoryCode: string
}

export function OfficialLettersView({
  pageKey,
  title,
  description,
  formTitle,
  categoryCode,
}: OfficialLettersViewProps) {
  const { canWriteDocuments } = usePermissions()
  const canUpload = canWriteDocuments()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<LetterKind | ''>('')
  const [sender, setSender] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const { data, isLoading, isError, error } = useDocuments({
    category: categoryCode,
    page: 1,
    limit: 50,
  })
  const items = (data?.data ?? []) as HaDocumentItem[]

  const resetForm = () => {
    setKind('')
    setSender('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!kind) throw new Error('กรุณาเลือกรายการหนังสือ')
      const agency = sender.trim()
      if (!agency) throw new Error('กรุณาระบุหน่วยงานที่ส่ง')
      if (!file) throw new Error('กรุณาเลือกไฟล์แนบ')
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('รองรับเฉพาะไฟล์ PDF')
      }
      const kindLabel = LETTER_KINDS.find((item) => item.value === kind)?.label ?? kind
      const toastHandle = openUploadToast({ fileName: file.name, fileSize: file.size })
      try {
        const message = await uploadDocument({
          title: agency,
          description: kindLabel,
          sectionNo: kind,
          categoryId: categoryCode,
          accessLevel: 'internal',
          file,
          onProgress: (percent, loaded) => toastHandle.update(percent, loaded),
        })
        toastHandle.success(message)
        return message
      } catch (err) {
        toastHandle.error(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ')
        throw err
      }
    },
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      resetForm()
      showSuccessToast(message || 'บันทึกข้อมูลแล้ว')
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ')
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <AdminEditablePageHeader pageKey={pageKey} title={title} description={description} />

      {canUpload ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">{formTitle}</h2>
          </header>
          <form
            className="space-y-4 px-5 py-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="official-letter-kind" className="text-sm font-medium text-slate-800">
                รายการหนังสือ
              </Label>
              <select
                id="official-letter-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as LetterKind | '')}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
              >
                <option value="">เลือกรายการหนังสือ</option>
                {LETTER_KINDS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="official-letter-sender" className="text-sm font-medium text-slate-800">
                หน่วยงานที่ส่ง
              </Label>
              <Input
                id="official-letter-sender"
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                className="h-10 border-slate-300 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="official-letter-file" className="text-sm font-medium text-slate-800">
                ไฟล์แนบ
              </Label>
              <div className="flex h-10 overflow-hidden rounded-md border border-slate-300 bg-white">
                <span className="flex min-w-0 flex-1 items-center px-3 text-sm text-slate-600">
                  <span className="truncate">{file ? file.name : 'เลือกไฟล์'}</span>
                </span>
                <button
                  type="button"
                  className="shrink-0 border-l border-slate-300 bg-slate-50 px-4 text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse
                </button>
                <input
                  ref={fileInputRef}
                  id="official-letter-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-9 rounded-md bg-[#2563eb] px-4 text-white shadow-none hover:bg-[#1d4ed8]"
            >
              {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">รายการที่บันทึก</h2>
        </header>
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-slate-500">กำลังโหลดรายการ...</p>
        ) : isError ? (
          <p className="px-5 py-8 text-sm text-rose-600">
            {error instanceof Error ? error.message : 'โหลดรายการไม่สำเร็จ'}
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <FileText className="mb-2 size-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">ยังไม่มีรายการ</p>
            <p className="mt-1 text-sm text-slate-500">
              {canUpload ? 'เลือกประเภทหนังสือ ระบุหน่วยงาน แล้วแนบไฟล์ PDF' : 'รอผู้ดูแลระบบบันทึกเอกสาร'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="pl-5">รายการหนังสือ</TableHead>
                <TableHead>หน่วยงานที่ส่ง</TableHead>
                <TableHead>ไฟล์แนบ</TableHead>
                <TableHead className="w-28 pr-5 text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="pl-5 font-medium text-slate-800">{letterKindLabel(doc)}</TableCell>
                  <TableCell className="text-slate-700">{doc.title}</TableCell>
                  <TableCell className="max-w-[16rem] truncate text-slate-600">
                    {doc.currentVersion?.fileName || '—'}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DocumentRowActions
                      documentId={doc.id}
                      title={doc.title}
                      fileName={doc.currentVersion?.fileName}
                      versionId={doc.currentVersion?.id}
                      hasFile={!!doc.currentVersion?.fileName || doc.currentVersion?.source === 'link'}
                      source={doc.currentVersion?.source}
                      previewUrl={doc.currentVersion?.previewUrl}
                      externalUrl={doc.currentVersion?.externalUrl}
                      compact
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
