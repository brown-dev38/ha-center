'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, FileText, Lightbulb, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RecordTimestamp } from '@/app/common/record-timestamp'
import { EmptyState } from '@/app/empty-state'
import { KmAddInnovationDialog } from '@/app/km/km-add-innovation-dialog'
import { KmAddResultDialog } from '@/app/km/km-add-result-dialog'
import { KmInnovationCard } from '@/app/km/km-innovation-card'
import { KmResultCard } from '@/app/km/km-result-card'
import { useKmSession } from '@/hooks/use-km'
import { usePermissions } from '@/hooks/use-permissions'
import { openKmReportPdf } from '@/app/km/km-api'
import { KM_SESSION_STATUS, type KmInnovationItem, type KmResultItem } from '@/app/km/km'
import { showErrorToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { useState } from 'react'

export function KmDetailView() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const { canWriteKm } = usePermissions()
  const [openingPdf, setOpeningPdf] = useState(false)
  const { data: session, isLoading, isError } = useKmSession(id)

  const handleOpenReport = async () => {
    setOpeningPdf(true)
    try {
      await openKmReportPdf(id)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'เปิด PDF ไม่สำเร็จ')
    } finally {
      setOpeningPdf(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลด...
      </div>
    )
  }

  if (isError || !session) {
    return (
      <div className="ha-page-stack">
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => router.push('/dashboard/km')}>
          <ArrowLeft className="size-4" />
          กลับ KM
        </Button>
        <EmptyState icon={Lightbulb} title="ไม่พบ KM Session" description="รายการอาจถูกลบหรือไม่มีสิทธิ์เข้าถึง" />
      </div>
    )
  }

  const status = KM_SESSION_STATUS[session.status] ?? {
    label: session.status,
    className: 'border-border bg-muted',
  }

  const results = session.results ?? []
  const innovations = session.innovations ?? []

  return (
    <div className="ha-page-stack">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/km" className="font-medium hover:text-primary">
          KM
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-foreground/80">{session.title}</span>
      </nav>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-2"
        onClick={() => router.push('/dashboard/km')}
      >
        <ArrowLeft className="size-4" />
        กลับรายการ KM
      </Button>

      <header className="surface-card overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-br from-primary/[0.06] to-ha-green/[0.04] p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border', status.className)}>
              {status.label}
            </Badge>
            {session.fiscalYear && <Badge variant="outline">ปี {session.fiscalYear}</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight lg:text-3xl">{session.title}</h1>
          {session.description && (
            <p className="mt-3 max-w-3xl text-muted-foreground">{session.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-primary/70" />
              {session.facilitator.name}
            </span>
            {session.department && <span>{session.department.name}</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(session.hasReport || session.fileName) && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-2"
                disabled={openingPdf}
                onClick={handleOpenReport}
              >
                <FileText className="size-4" />
                {openingPdf ? 'กำลังเปิด...' : 'เปิดรายงาน PDF'}
              </Button>
            )}
            {canWriteKm() && (
              <>
                <KmAddResultDialog sessionId={session.id} />
                <KmAddInnovationDialog sessionId={session.id} fiscalYear={session.fiscalYear} />
              </>
            )}
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:max-w-xl">
          <RecordTimestamp iso={session.sessionDate} label="published" variant="premium" />
        </div>
      </header>

      <section className="ha-page-section">
        <h2 className="section-title">ผลลัพธ์จาก KM ({results.length})</h2>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีผลลัพธ์ — เพิ่มระบบที่พัฒนาหรือผลลัพธ์อื่น</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <KmResultCard
                key={r.id}
                item={
                  {
                    ...r,
                    sessionId: session.id,
                    type: r.type as 'system' | 'innovation',
                    year: session.fiscalYear,
                    imageUrl: r.imageUrl,
                    systemUrl: r.systemUrl,
                    author: { id: '', name: '—' },
                  } as KmResultItem
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="ha-page-section">
        <h2 className="section-title">นวัตกรรม ({innovations.length})</h2>
        {innovations.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีนวัตกรรมที่บันทึกใน Session นี้</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {innovations.map((i) => (
              <KmInnovationCard
                key={i.id}
                item={
                  {
                    ...i,
                    sessionId: session.id,
                    status: 'published',
                    author: { id: '', name: '—' },
                    session: { id: session.id, title: session.title },
                  } as KmInnovationItem
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
