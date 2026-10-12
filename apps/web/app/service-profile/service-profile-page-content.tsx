'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Sparkles,
  Users,
} from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { HaLogo } from '@/app/brand/ha-logo'
import { GovernanceStructure } from '@/app/service-profile/governance-structure'
import { ServiceCatalogCard } from '@/app/service-profile/service-catalog-card'
import { ServiceJourney } from '@/app/service-profile/service-journey'
import { UnitProfileWorksheetForm } from '@/app/service-profile/unit-profile-worksheet-form'
import { WorksheetListPanel } from '@/app/service-profile/worksheet-list-panel'
import {
  catalogByScope,
  HA_STANDARD_PILLARS,
  METRIC_HIGHLIGHTS,
  RELATED_RESOURCES,
  SP_META,
  type ServiceScope,
  VALUE_PILLARS,
} from '@/app/service-profile/service-profile'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'
import { sectionLabelClass } from '@/app/common/ui/section-label'

const SCOPE_LABELS: Record<ServiceScope, { title: string; subtitle: string; icon: typeof Building2 }> = {
  hospital: {
    title: 'ทั้งโรงพยาบาล',
    subtitle: 'บริการมาตรฐาน HA ระดับองค์กร',
    icon: Building2,
  },
  leadership: {
    title: 'ทีมนำคร่อมสายงาน',
    subtitle: 'บริการทีมนำคุณภาพและคณะกรรมการ',
    icon: Users,
  },
}

export function ServiceProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab')
  const worksheetId = searchParams.get('id')
  const duplicateId = searchParams.get('duplicate')
  const [scope, setScope] = useState<ServiceScope>('hospital')
  const [tab, setTab] = useState<'overview' | 'worksheet' | 'documents'>(
    initialTab === 'documents' ? 'documents' : 'worksheet'
  )
  const [activeWorksheetId, setActiveWorksheetId] = useState<string | null>(
    duplicateId ? null : worksheetId
  )
  const [duplicateFromId, setDuplicateFromId] = useState<string | null>(duplicateId)
  const catalog = catalogByScope(scope)

  useEffect(() => {
    if (worksheetId) {
      setActiveWorksheetId(worksheetId)
      setDuplicateFromId(null)
      setTab('worksheet')
    }
  }, [worksheetId])

  useEffect(() => {
    if (duplicateId) {
      setDuplicateFromId(duplicateId)
      setActiveWorksheetId(null)
      setTab('worksheet')
    }
  }, [duplicateId])

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="service-profile"
        title={`${SP_META.title} — ${SP_META.titleTh}`}
        description={SP_META.tagline}
      />

      <div className="inline-flex w-fit rounded-xl border border-border/80 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setTab('worksheet')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
            tab === 'worksheet' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ClipboardList className="size-4" />
          Unit Profile Worksheet
        </button>
        <button
          type="button"
          onClick={() => setTab('documents')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
            tab === 'documents' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FolderOpen className="size-4" />
          เอกสารทั้งหมด
        </button>
        {/* ภาพรวมบริการ — ซ่อนชั่วคราว
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
            tab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Building2 className="size-4" />
          ภาพรวมบริการ
        </button>
        */}
      </div>

      {tab === 'worksheet' ? (
        <UnitProfileWorksheetForm
          worksheetId={activeWorksheetId}
          duplicateFromId={duplicateFromId}
          onSavedAction={(id) => {
            setActiveWorksheetId(id)
            setDuplicateFromId(null)
          }}
          onCreateNewAction={() => {
            setActiveWorksheetId(null)
            setDuplicateFromId(null)
          }}
        />
      ) : tab === 'documents' ? (
        <WorksheetListPanel
          onCreateNewAction={() => {
            setActiveWorksheetId(null)
            setTab('worksheet')
          }}
          onEditAction={(id) => {
            setActiveWorksheetId(id)
            setDuplicateFromId(null)
            setTab('worksheet')
            router.push(`/dashboard/service-profile?tab=worksheet&id=${encodeURIComponent(id)}`, {
              scroll: false,
            })
          }}
        />
      ) : (
        <>
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 100% 0%, oklch(0.58 0.11 200 / 0.12), transparent 50%), radial-gradient(ellipse 60% 50% at 0% 100%, oklch(0.42 0.1 240 / 0.1), transparent 55%)',
          }}
        />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.2fr_1fr] lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <HaLogo size="lg" />
            <div>
              <p className={sectionLabelClass()}>{SP_META.hospital}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">{SP_META.unit}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:text-base">
                Service Profile คือภาพรวมบริการที่ศูนย์ HA และทีมนำคุณภาพมอบให้ — ชัดเจน
                ตรวจสอบได้ และสอดคล้องมาตรฐานโรงพยาบาล
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                อัปเดต {SP_META.lastUpdated}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {METRIC_HIGHLIGHTS.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-border/60 bg-white/90 p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tabular-nums text-primary">{m.value}</p>
                <p className="mt-1 text-xs font-semibold text-foreground">{m.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={cn('flex flex-col gap-5')}>
        <div>
          <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>หลักการให้บริการ</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>คุณค่าที่กำหนดทิศทางทุกบริการของศูนย์ HA</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {VALUE_PILLARS.map((v) => {
            const Icon = v.icon
            return (
              <div
                key={v.title}
                className={cn(surfaceCardClass(undefined, true), "group p-6 text-center md:text-left")}
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-ha-green/10 text-primary transition group-hover:from-primary group-hover:to-primary group-hover:text-primary-foreground md:mx-0">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Scope tabs + catalog */}
      <section className={cn('flex flex-col gap-5')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>แคตตาล็อกบริการ</h2>
            <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>เลือกมุมมองบริการตามกลุ่มผู้รับบริการ</p>
          </div>
          <div className="inline-flex rounded-xl border border-border/80 bg-muted/30 p-1">
            {(Object.keys(SCOPE_LABELS) as ServiceScope[]).map((key) => {
              const cfg = SCOPE_LABELS[key]
              const Icon = cfg.icon
              const active = scope === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScope(key)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{cfg.title}</span>
                  <span className="sm:hidden">{key === 'hospital' ? 'รพ.' : 'ทีมนำ'}</span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{SCOPE_LABELS[scope].subtitle}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((item) => (
            <ServiceCatalogCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Governance + Standards */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className={cn('flex flex-col gap-5')}>
          <div>
            <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>โครงสร้างกำกับดูแลคุณภาพ</h2>
            <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>สายการบังคับบัญชาตั้งแต่ผู้บริหารถึงหน่วยงาน</p>
          </div>
          <GovernanceStructure />
        </div>
        <div className={cn('flex flex-col gap-5')}>
          <div>
            <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>มิติมาตรฐาน HA</h2>
            <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>เชื่อมโยงบริการกับหลักเกณฑ์การรับรอง</p>
          </div>
          <ul className="space-y-3">
            {HA_STANDARD_PILLARS.map((p) => (
              <li
                key={p.id}
                className={cn(surfaceCardClass(), "flex gap-4 p-4 transition hover:border-primary/20")}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {p.code}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Journey */}
      <section className={cn(surfaceCardClass(), "overflow-hidden p-6 lg:p-8")}>
        <div className="mb-8">
          <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>เส้นทางการให้บริการ (Service Journey)</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>
            ตั้งแต่รับคำขอจนถึงทบทวนผล — โปร่งใสและวัดผลได้
          </p>
        </div>
        <ServiceJourney />
      </section>

      {/* Related resources */}
      <section className={cn('flex flex-col gap-5')}>
        <div>
          <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>เอกสารและลิงก์ที่เกี่ยวข้อง</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>เข้าถึงรายงานทีมนำและช่องทางติดต่อ</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {RELATED_RESOURCES.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className={cn(surfaceCardClass(undefined, true), "group flex items-center justify-between gap-3 p-4")}
            >
              <div>
                <p className="font-medium text-foreground group-hover:text-primary">{r.label}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ))}
        </div>
        <Link
          href="/dashboard/contact"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          ขอคำปรึกษาเพิ่มเติม
          <ArrowRight className="size-3.5" />
        </Link>
      </section>
        </>
      )}
    </div>
  )
}
