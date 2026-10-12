'use client'

import { Award, Download, ExternalLink } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useMyCertificates } from '@/hooks/use-elearning'
import { getApiUrl } from '@/app/common/api-url'
import { formatDateThai } from '@/app/common/datetime'
import { openCertificatePdf } from '@/app/elearning/elearning-api'
import { showErrorToast } from '@/app/common/toast-store'

export function ElearnCertificatesPanel() {
  const { data: certs, isLoading } = useMyCertificates()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">กำลังโหลดใบรับรอง...</p>
  }

  if (!certs?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
        <Award className="mx-auto size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          ยังไม่มีใบรับรอง — เรียนครบและสอบผ่านเพื่อรับใบรับรอง
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {certs.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-3 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Award className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{c.course.title}</p>
              <p className="text-xs text-muted-foreground">เลขที่ {c.certificateNo}</p>
              {c.score != null && (
                <p className="mt-1 text-sm font-bold text-primary">คะแนน {Math.round(c.score)}%</p>
              )}
              <p className="text-xs text-muted-foreground">{formatDateThai(c.issuedAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-2"
              onClick={async () => {
                try {
                  await openCertificatePdf(c.id)
                } catch (e) {
                  showErrorToast(e instanceof Error ? e.message : 'เปิด PDF ไม่สำเร็จ')
                }
              }}
            >
              <Download className="size-4" />
              ดาวน์โหลด
            </Button>
            <a
              href={`${getApiUrl()}${c.verifyUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1' })}
            >
              <ExternalLink className="size-3.5" />
              ตรวจสอบ
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
