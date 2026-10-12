'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search } from 'lucide-react'
import { fetchApiData } from '@/app/common/api-json'
import { cn } from '@/app/common/utils'
import { QualityLevelSelect, useQualityDocumentLevels } from '@/app/documents/quality-level-select'
import type { HaDocumentItem } from '@/app/documents/documents'
import {
  QualityDocumentsPagination,
  QualityDocumentsTable,
} from '@/app/documents/quality-documents-table'
import { useDocuments } from '@/hooks/use-documents'
import { EmptyState } from '@/app/empty-state'
import { Button } from '@/components/ui/button'

type DepartmentOption = {
  id: string
  code: string
  name: string
}

const PAGE_SIZE = 10

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export default function DocumentsByDepartmentPage() {
  const [departmentCode, setDepartmentCode] = useState('')
  const [levelCode, setLevelCode] = useState('')
  const [appliedDepartment, setAppliedDepartment] = useState('')
  const [appliedLevel, setAppliedLevel] = useState('')
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)

  const { data: qualityLevels = [] } = useQualityDocumentLevels()
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['documents', 'departments'],
    queryFn: () => fetchApiData<DepartmentOption[]>('documents/departments'),
  })

  const { data, isLoading, isError, error, isFetching } = useDocuments({
    sectionNo: appliedDepartment || undefined,
    category: appliedLevel || undefined,
    page,
    limit: PAGE_SIZE,
    enabled: searched && !!(appliedDepartment || appliedLevel),
  })

  const items = (data?.data ?? []) as HaDocumentItem[]
  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1
  const showResults = searched && !!(appliedDepartment || appliedLevel)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!departmentCode && !levelCode) return
    setAppliedDepartment(departmentCode)
    setAppliedLevel(levelCode)
    setPage(1)
    setSearched(true)
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-5xl flex-col gap-5')}>
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
          แยกตามหน่วยงาน/ทีม
        </h1>
        <nav className="text-sm text-sky-700">
          <Link href="/dashboard/documents" className="hover:underline">
            เอกสารคุณภาพ
          </Link>
          <span className="mx-1.5 text-slate-400">/</span>
          <span className="text-slate-600">แยกตามหน่วยงาน/ทีม</span>
        </nav>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <p className="mb-4 text-sm font-medium text-slate-700">
          เลือกหน่วยงาน/ทีม - ระดับเอกสารคุณภาพ
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className={cn(selectClass, 'md:flex-1')}
            value={departmentCode}
            disabled={departmentsLoading}
            onChange={(e) => setDepartmentCode(e.target.value)}
            aria-label="หน่วยงาน/ทีม"
          >
            <option value="">เลือกหน่วยงาน/ทีม</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <QualityLevelSelect
            className="md:flex-1"
            value={levelCode}
            levels={qualityLevels}
            onChange={setLevelCode}
          />

          <Button
            type="submit"
            className="h-10 shrink-0 gap-1.5 bg-teal-600 px-5 hover:bg-teal-700"
            disabled={(!departmentCode && !levelCode) || isFetching}
          >
            <Search className="size-4" />
            ค้นหา
          </Button>
        </div>
      </form>

      {showResults && (
        <section className="space-y-4">
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
              <div className="size-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              กำลังค้นหาเอกสาร...
            </div>
          )}

          {isError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error instanceof Error ? error.message : 'ค้นหาไม่สำเร็จ'}
            </p>
          )}

          {!isLoading && !isFetching && !isError && items.length === 0 && (
            <EmptyState
              icon={FileText}
              title="ไม่พบเอกสารตามเงื่อนไข"
              description="ลองเปลี่ยนหน่วยงาน/ทีม หรือระดับเอกสารคุณภาพ"
            />
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
        </section>
      )}
    </div>
  )
}
