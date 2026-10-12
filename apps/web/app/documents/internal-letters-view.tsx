'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { openUploadToast } from '@/app/common/upload-progress-toast'
import { deleteDocument } from '@/app/documents/document-api'
import { DocumentViewerDialog } from '@/app/documents/document-viewer-dialog'
import type { HaDocumentItem } from '@/app/documents/documents'
import { formatQualityEffectiveDate } from '@/app/documents/quality-document-meta'
import { uploadDocument } from '@/app/documents/upload-document'
import { useDocuments } from '@/hooks/use-documents'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/app/common/utils'

const TABS = [
  { value: 'receive', label: 'รับ' },
  { value: 'send', label: 'ส่ง' },
] as const

type LetterKind = (typeof TABS)[number]['value']
type SortKey = 'index' | 'number' | 'subject' | 'agency' | 'receivedAt' | 'recordedAt'
type SortDir = 'asc' | 'desc'

const PAGE_SIZES = [10, 25, 50, 100]

type LetterRow = {
  id: string
  number: string
  subject: string
  agency: string
  receivedAt: string | null
  recordedAt: string
  doc: HaDocumentItem
}

function parseLetter(doc: HaDocumentItem): LetterRow {
  let agency = ''
  let receivedAt: string | null = null
  let tagged = false
  for (const raw of (doc.description ?? '').split(/\r?\n/)) {
    const line = raw.trim()
    const agencyMatch = line.match(/^หน่วยงาน\s*:\s*(.+)$/)
    if (agencyMatch?.[1]) {
      agency = agencyMatch[1].trim()
      tagged = true
      continue
    }
    const dateMatch = line.match(/^วันที่รับหนังสือ\s*:\s*(.+)$/)
    if (dateMatch?.[1]) {
      receivedAt = dateMatch[1].trim()
      tagged = true
    }
  }

  if (tagged || doc.documentNo?.trim()) {
    return {
      id: doc.id,
      number: doc.documentNo?.trim() || '—',
      subject: doc.title?.trim() || '—',
      agency: agency || '—',
      receivedAt,
      recordedAt: doc.createdAt,
      doc,
    }
  }

  return {
    id: doc.id,
    number: '—',
    subject: '—',
    agency: doc.title?.trim() || '—',
    receivedAt: null,
    recordedAt: doc.createdAt,
    doc,
  }
}

function compareRows(a: LetterRow, b: LetterRow, key: SortKey, dir: SortDir) {
  const factor = dir === 'asc' ? 1 : -1
  const text = (left: string, right: string) => left.localeCompare(right, 'th') * factor
  if (key === 'number') return text(a.number, b.number)
  if (key === 'subject') return text(a.subject, b.subject)
  if (key === 'agency') return text(a.agency, b.agency)
  if (key === 'receivedAt') return text(a.receivedAt ?? '', b.receivedAt ?? '')
  if (key === 'recordedAt') return text(a.recordedAt, b.recordedAt)
  return 0
}

function SortMark({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 text-slate-300" />
  return dir === 'asc' ? (
    <ArrowUp className="size-3.5 text-sky-600" />
  ) : (
    <ArrowDown className="size-3.5 text-sky-600" />
  )
}

export function InternalLettersView({
  pageKey = 'documents-official-internal',
  title = 'หนังสือภายใน',
  description = 'เอกสารราชการประเภทหนังสือภายใน',
  categoryCode = 'GOV-IN',
}: {
  pageKey?: string
  title?: string
  description?: string
  categoryCode?: string
}) {
  const { canWriteDocuments, canDeleteDocuments } = usePermissions()
  const canUpload = canWriteDocuments()
  const canDelete = canDeleteDocuments()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<LetterKind>('receive')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('recordedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [addOpen, setAddOpen] = useState(false)
  const [letterNo, setLetterNo] = useState('')
  const [subject, setSubject] = useState('')
  const [agency, setAgency] = useState('')
  const [receivedDate, setReceivedDate] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [viewer, setViewer] = useState<HaDocumentItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<LetterRow | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isError, error } = useDocuments({
    category: categoryCode,
    sectionNo: tab,
    search: search || undefined,
    page,
    limit: pageSize,
  })

  const pagination = data?.pagination
  const rows = useMemo(() => {
    const parsed = ((data?.data ?? []) as HaDocumentItem[]).map(parseLetter)
    if (sortKey === 'index') return sortDir === 'asc' ? parsed : [...parsed].reverse()
    return [...parsed].sort((a, b) => compareRows(a, b, sortKey, sortDir))
  }, [data?.data, sortKey, sortDir])

  const total = pagination?.total ?? 0
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const resetForm = () => {
    setLetterNo('')
    setSubject('')
    setAgency('')
    setReceivedDate('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'recordedAt' || key === 'receivedAt' ? 'desc' : 'asc')
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const number = letterNo.trim()
      const title = subject.trim()
      const office = agency.trim()
      if (!number) throw new Error('กรุณาระบุเลขหนังสือ')
      if (!title) throw new Error('กรุณาระบุชื่อเรื่อง')
      if (!office) throw new Error('กรุณาระบุหน่วยงาน')
      if (!receivedDate) throw new Error('กรุณาระบุวันที่รับหนังสือ')
      if (!file) throw new Error('กรุณาเลือกไฟล์แนบ')
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('รองรับเฉพาะไฟล์ PDF')
      }
      const kindLabel = tab === 'receive' ? 'หนังสือรับ' : 'หนังสือส่ง'
      const toastHandle = openUploadToast({ fileName: file.name, fileSize: file.size })
      try {
        const message = await uploadDocument({
          title,
          documentNo: number,
          description: `หน่วยงาน: ${office}\nวันที่รับหนังสือ: ${receivedDate}\nรายการ: ${kindLabel}`,
          sectionNo: tab,
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
      setAddOpen(false)
      resetForm()
      showSuccessToast(message || 'บันทึกหนังสือแล้ว')
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setPendingDelete(null)
      showSuccessToast(message || 'ลบหนังสือแล้ว')
    },
    onError: (err) => {
      showErrorToast(err instanceof Error ? err.message : 'ลบหนังสือไม่สำเร็จ')
    },
  })

  const tabLabel = tab === 'receive' ? 'รับ' : 'ส่ง'

  return (
    <div className="flex flex-col gap-4">
      <AdminEditablePageHeader
        pageKey={pageKey}
        title={title}
        description={description}
        variant="simple"
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {canUpload ? (
            <Button
              type="button"
              className="h-9 gap-1.5 bg-[#17a2b8] px-3 text-white shadow-none hover:bg-[#138496]"
              onClick={() => {
                resetForm()
                setAddOpen(true)
              }}
            >
              <Plus className="size-4" />
              เพิ่มหนังสือ
            </Button>
          ) : (
            <span />
          )}
        </div>

        <div className="flex gap-6 border-b border-slate-200 px-4">
          {TABS.map((item) => {
            const active = tab === item.value
            return (
              <button
                key={item.value}
                type="button"
                className={cn(
                  '-mb-px border-b-2 px-1 py-3 text-sm font-medium',
                  active
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
                onClick={() => {
                  setTab(item.value)
                  setPage(1)
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            แสดง
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            รายการ
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            ค้นหา:
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-9 w-56 border-slate-300"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-y border-slate-200 text-left text-slate-600">
                {(
                  [
                    ['index', '#', 'w-14'],
                    ['number', 'เลขหนังสือ', 'w-36'],
                    ['subject', 'ชื่อเรื่อง', ''],
                    ['agency', 'หน่วยงาน', 'w-56'],
                    ['receivedAt', 'วันที่รับหนังสือ', 'w-36'],
                    ['recordedAt', 'วันที่บันทึก', 'w-32'],
                  ] as const
                ).map(([key, label, width]) => (
                  <th key={key} className={cn('px-3 py-2 font-medium', width)}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <SortMark active={sortKey === key} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="w-28 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    กำลังโหลดรายการ...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-rose-600">
                    {error instanceof Error ? error.message : 'โหลดรายการไม่สำเร็จ'}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    ยังไม่มีหนังสือ{tabLabel}
                    {search ? ' ที่ตรงกับคำค้น' : ''}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-500">{from + index}</td>
                    <td className="px-3 py-3 font-medium text-slate-800">{row.number}</td>
                    <td className="px-3 py-3 leading-6 text-slate-700">{row.subject}</td>
                    <td className="px-3 py-3 text-slate-700">{row.agency}</td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatQualityEffectiveDate(row.receivedAt)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {formatQualityEffectiveDate(row.recordedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-stretch gap-1.5">
                        <button
                          type="button"
                          className="rounded bg-[#2563eb] px-2 py-1 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={!row.doc.currentVersion}
                          onClick={() => setViewer(row.doc)}
                        >
                          ดูเอกสาร
                        </button>
                        {canDelete ? (
                          <button
                            type="button"
                            className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                            onClick={() => setPendingDelete(row)}
                          >
                            ลบ
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            กำลังแสดง {from.toLocaleString('th-TH')} ถึง {to.toLocaleString('th-TH')} จาก{' '}
            {total.toLocaleString('th-TH')} รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ก่อนหน้า
            </Button>
            <span>
              {page.toLocaleString('th-TH')} / {Math.max(pagination?.totalPages ?? 1, 1).toLocaleString('th-TH')}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= (pagination?.totalPages ?? 1)}
              onClick={() => setPage((current) => current + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มหนังสือ{tabLabel}</DialogTitle>
            <DialogDescription>บันทึกเข้าแท็บ{tabLabel} ของ{title}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              createMutation.mutate()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="internal-letter-no">เลขหนังสือ</Label>
              <Input
                id="internal-letter-no"
                value={letterNo}
                onChange={(event) => setLetterNo(event.target.value)}
                placeholder="เช่น อว7307/3787"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internal-letter-subject">ชื่อเรื่อง</Label>
              <textarea
                id="internal-letter-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internal-letter-agency">หน่วยงาน</Label>
              <Input
                id="internal-letter-agency"
                value={agency}
                onChange={(event) => setAgency(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internal-letter-date">วันที่รับหนังสือ</Label>
              <Input
                id="internal-letter-date"
                type="date"
                value={receivedDate}
                onChange={(event) => setReceivedDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internal-letter-file">ไฟล์แนบ</Label>
              <div className="flex h-10 overflow-hidden rounded-md border border-slate-300 bg-white">
                <span className="flex min-w-0 flex-1 items-center px-3 text-sm text-slate-600">
                  <span className="truncate">{file ? file.name : 'เลือกไฟล์ PDF'}</span>
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
                  id="internal-letter-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#17a2b8] hover:bg-[#138496]">
                {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ลบหนังสือ</DialogTitle>
            <DialogDescription>
              นำ {pendingDelete?.number || 'รายการนี้'} ออกจากรายการหนังสือ{tabLabel}
              {pendingDelete?.subject && pendingDelete.subject !== '—'
                ? ` — ${pendingDelete.subject}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={deleteMutation.isPending || !pendingDelete}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewer ? (
        <DocumentViewerDialog
          open
          onOpenChange={(open) => {
            if (!open) setViewer(null)
          }}
          documentId={viewer.id}
          title={viewer.title}
          fileName={viewer.currentVersion?.fileName}
          versionId={viewer.currentVersion?.id}
          source={viewer.currentVersion?.source}
          previewUrl={viewer.currentVersion?.previewUrl}
          externalUrl={viewer.currentVersion?.externalUrl}
        />
      ) : null}
    </div>
  )
}
