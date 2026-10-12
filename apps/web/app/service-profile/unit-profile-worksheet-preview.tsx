'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/app/page-header'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { showErrorToast } from '@/app/common/toast-store'
import { WorksheetDocumentView } from '@/app/service-profile/worksheet-document-view'
import {
  createEmptyWorksheet,
  normalizeWorksheet,
  WORKSHEET_STORAGE_KEY,
  type UnitProfileWorksheet,
} from '@/app/service-profile/worksheet-types'
import { downloadWorksheetPdf, worksheetFilename } from '@/app/service-profile/worksheet-export'
import { downloadWorksheetDocx } from '@/app/service-profile/worksheet-docx'
import { useWorksheet } from '@/hooks/use-worksheets'
import { alertNoWorksheetEditPermission } from '@/app/service-profile/worksheet-access'

function PreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const worksheetId = searchParams.get('id')
  const { data: remote, isLoading, isError } = useWorksheet(worksheetId ?? undefined)
  const [fallback, setFallback] = useState<UnitProfileWorksheet | null>(null)
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null)

  useEffect(() => {
    if (worksheetId) return
    try {
      const raw = localStorage.getItem(WORKSHEET_STORAGE_KEY)
      if (raw) setFallback(normalizeWorksheet(JSON.parse(raw)))
      else setFallback(createEmptyWorksheet())
    } catch {
      setFallback(createEmptyWorksheet())
    }
  }, [worksheetId])

  const data: UnitProfileWorksheet | null = remote?.formData
    ? normalizeWorksheet(remote.formData)
    : fallback

  const handleWord = async () => {
    if (!data) return
    setExporting('word')
    try {
      await downloadWorksheetDocx(data, worksheetFilename(data, 'docx'))
    } catch (err) {
      console.error('[worksheet-docx]', err)
      showErrorToast('สร้างไฟล์ Word ไม่สำเร็จ')
    } finally {
      setExporting(null)
    }
  }

  const handlePdf = async () => {
    if (!data) return
    setExporting('pdf')
    try {
      await downloadWorksheetPdf(data, worksheetFilename(data, 'pdf'))
    } catch (err) {
      console.error('[worksheet-pdf]', err)
      showErrorToast('สร้างไฟล์ PDF ไม่สำเร็จ')
    } finally {
      setExporting(null)
    }
  }

  const handleBackToEdit = () => {
    if (!worksheetId) {
      router.push('/dashboard/service-profile')
      return
    }
    if (remote && remote.status === 'draft' && remote.canEdit === false) {
      alertNoWorksheetEditPermission()
      return
    }
    router.push(`/dashboard/service-profile?tab=worksheet&id=${encodeURIComponent(worksheetId)}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        กำลังโหลดเอกสาร...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
        โหลดเอกสารไม่สำเร็จ — กลับไปบันทึกแบบร่างก่อน
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Unit Profile Worksheet" description="ตัวอย่างเอกสารก่อนดาวน์โหลด" variant="simple" />

      <div className={cn(surfaceCardClass(), 'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between')}>
        <div>
          <h2 className="text-base font-bold text-foreground">เลือกรูปแบบไฟล์</h2>
          <p className="text-sm text-muted-foreground">
            {remote ? `${remote.title} · ${remote.department.name} · ${remote.status}` : 'ดาวน์โหลดเป็น Word (.doc) หรือ PDF (.pdf)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleBackToEdit}>
            <ArrowLeft className="size-4" />
            กลับไปแก้ไข
          </Button>
          <Button type="button" variant="outline" onClick={handleWord} disabled={exporting !== null}>
            {exporting === 'word' ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            ดาวน์โหลด Word
          </Button>
          <Button type="button" onClick={() => void handlePdf()} disabled={exporting !== null}>
            {exporting === 'pdf' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            ดาวน์โหลด PDF
          </Button>
        </div>
      </div>

      <WorksheetDocumentView data={data} />
    </div>
  )
}

export function UnitProfileWorksheetPreview() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          กำลังโหลด...
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  )
}
