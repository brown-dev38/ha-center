'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  Headphones,
  ShieldCheck,
} from 'lucide-react'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { HaLogo } from '@/app/brand/ha-logo'
import { ContactChannelCard } from '@/app/contact/contact-channel-card'
import { ContactConsultForm } from '@/app/contact/contact-consult-form'
import { ContactFaq } from '@/app/contact/contact-faq'
import {
  CONTACT_CHANNELS,
  CONTACT_FAQ,
  HA_CONTACT,
  SERVICE_OFFERINGS,
  TEAM_CONTACTS,
} from '@/app/contact/contact'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

export function ContactPageContent() {
  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="contact"
        title="ติดต่อ / ปรึกษา ศูนย์คุณภาพ HA"
        description={HA_CONTACT.tagline}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 0% 0%, oklch(0.42 0.1 240 / 0.08), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, oklch(0.58 0.11 200 / 0.1), transparent 50%)',
          }}
        />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <HaLogo size="lg" className="sm:!size-20" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {HA_CONTACT.hospital}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                {HA_CONTACT.name}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
                เราพร้อมเป็นที่ปรึกษาด้าน Hospital Accreditation — ตั้งแต่การทำความเข้าใจมาตรฐาน
                การจัดทำเอกสาร CQI/KM ไปจนถึงการใช้เครื่องมือดิจิทัลใน HA Center
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2">
            {[
              { icon: Headphones, label: 'ช่องทาง', value: '4 ช่องทาง' },
              { icon: Clock, label: 'เวลาให้บริการ', value: HA_CONTACT.hours },
              { icon: ShieldCheck, label: 'การตอบกลับ', value: '1–2 วันทำการ' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/80 px-4 py-3 backdrop-blur-sm"
              >
                <stat.icon className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className={cn('flex flex-col gap-5')}>
        <div>
          <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>ช่องทางติดต่อ</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>เลือกช่องทางที่สะดวก — ทุกช่องทางเชื่อมกับทีมศูนย์ HA โดยตรง</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CONTACT_CHANNELS.map((ch) => (
            <ContactChannelCard key={ch.id} channel={ch} />
          ))}
        </div>
      </section>

      {/* Services bento */}
      <section className={cn('flex flex-col gap-5')}>
        <div>
          <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>บริการที่ปรึกษาได้</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>
            เข้าถึงเครื่องมือในระบบได้ทันที — หรือขอคำปรึกษาผ่านฟอร์มด้านล่าง
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_OFFERINGS.map((svc, i) => {
            const Icon = svc.icon
            return (
              <Link
                key={svc.id}
                href={svc.href}
                className={cn(
                  cn(surfaceCardClass(undefined, true), 'group flex flex-col p-5'),
                  i === 0 && 'sm:col-span-2 lg:col-span-1 lg:row-span-1 ring-1 ring-primary/20'
                )}
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-ha-green/10 text-primary transition group-hover:from-primary group-hover:to-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary">{svc.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {svc.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                  เปิดในระบบ
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Team + Form */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <div className={cn('flex flex-col gap-5')}>
          <div>
            <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>ทีมงานศูนย์ HA</h2>
            <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>ผู้ประสานงานหลักตามสายงาน</p>
          </div>
          <ul className="space-y-3">
            {TEAM_CONTACTS.map((member, i) => (
              <li
                key={member.role}
                className={cn(surfaceCardClass(), "flex gap-4 p-4 transition hover:border-primary/20")}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {member.role}
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">{member.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{member.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/meetings"
            className={cn(surfaceCardClass(undefined, true), "flex items-center justify-between gap-3 p-4")}
          >
            <div>
              <p className="font-medium text-foreground">นัดประชุมปรึกษา</p>
              <p className="text-sm text-muted-foreground">จองห้องและเชิญทีมคุณภาพเข้าร่วม</p>
            </div>
            <ArrowRight className="size-5 text-primary" />
          </Link>
        </div>

        <ContactConsultForm />
      </section>

      {/* FAQ */}
      <section className={cn('flex flex-col gap-5')}>
        <div>
          <h2 className={cn(cn('font-heading text-[1.05rem] font-bold leading-snug text-foreground'), "text-lg")}>คำถามที่พบบ่อย</h2>
          <p className={cn(cn('text-sm leading-relaxed text-muted-foreground'), "mt-1")}>ข้อมูลเบื้องต้นก่อนติดต่อทีมงาน</p>
        </div>
        <ContactFaq items={CONTACT_FAQ} />
      </section>
    </div>
  )
}
