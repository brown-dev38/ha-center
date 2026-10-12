'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { useDocuments } from '@/hooks/use-documents'
import { usePermissions } from '@/hooks/use-permissions'
import type { HaDocumentItem } from '@/app/documents/documents'
import {
  QualityDocumentsPagination,
  QualityDocumentsTable,
} from '@/app/documents/quality-documents-table'
import { EmptyState } from '@/app/empty-state'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/app/common/utils'

const PAGE_SIZE = 10

export default function DocumentsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { canWriteDocuments } = usePermissions()
  const canUpload = canWriteDocuments()

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search])

  const { data, isLoading, isError, error } = useDocuments({
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const items = (data?.data ?? []) as HaDocumentItem[]
  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-5')}>
      <header className="border-b border-slate-200 pb-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
          เอกสารคุณภาพ
        </h1>
        <p className="mt-1 text-sm text-slate-500">แสดงเอกสารคุณภาพทั้งหมด</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canUpload ? (
          <Link
            href="/dashboard/documents/add"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-fit gap-1.5 bg-teal-600 hover:bg-teal-700'
            )}
          >
            <Plus className="size-4" />
            เพิ่มเอกสาร
          </Link>
        ) : (
          <span />
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="shrink-0 font-medium">ค้นหา:</span>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="รหัส / ชื่อเอกสาร"
            className="h-9 w-full sm:w-64"
          />
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-10 text-sm text-slate-500">
          <div className="size-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          กำลังโหลดเอกสาร...
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : 'โหลดรายการไม่สำเร็จ'}
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={FileText}
          title={search ? 'ไม่พบเอกสารตามคำค้นหา' : 'ยังไม่มีเอกสารคุณภาพ'}
          description={
            search
              ? 'ลองเปลี่ยนคำค้นหา'
              : canUpload
                ? 'กดปุ่มเพิ่มเอกสารเพื่อเริ่มต้น'
                : 'รอผู้ดูแลระบบเพิ่มเอกสาร'
          }
        >
          {search ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setSearchInput('')}>
              ล้างคำค้นหา
            </Button>
          ) : (
            canUpload && (
              <Link
                href="/dashboard/documents/add"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'gap-1.5 bg-teal-600 hover:bg-teal-700'
                )}
              >
                <Plus className="size-4" />
                เพิ่มเอกสาร
              </Link>
            )
          )}
        </EmptyState>
      )}

      {!isLoading && items.length > 0 && (
        <>
          <QualityDocumentsTable documents={items} page={page} pageSize={PAGE_SIZE} />
          <QualityDocumentsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
