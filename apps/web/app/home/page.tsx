'use client'

import Link from 'next/link'
import { BarChart3, CalendarDays, ChevronRight, ClipboardCheck, FileText, PieChart as PieIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useIndicatorsDashboard } from '@/hooks/use-indicators'
import { useMeetingsUpcoming } from '@/hooks/use-meetings'
import { useDocuments } from '@/hooks/use-documents'
import { useCqiDepartmentsSummary } from '@/hooks/use-cqi'
import { useAuthUser } from '@/app/common/use-auth'
import { MenuCards } from '@/app/menu-cards'
import { AdminEditablePageHeader } from '@/app/admin/admin-editable-page-header'
import { SectionHeader } from '@/app/section-header'
import { StatCard } from '@/app/stat-card'
import { ContentPanel } from '@/app/content-panel'
import { ChartCard } from '@/app/charts/chart-card'
import { CHART_COLORS, CHART_GRID_COLOR, chartAxisTick } from '@/app/charts/chart-theme'
import { MeetingScheduleTimestamp, RecordTimestamp } from '@/app/common/record-timestamp'
import type { HaDocumentItem } from '@/app/documents/documents'
import type { MeetingListItem } from '@/app/meetings/meetings'
import { cn } from '@/app/common/utils'

export default function DashboardPage() {
  const user = useAuthUser()
  const { data: indicatorDash, isLoading: indLoading } = useIndicatorsDashboard()
  const { data: upcoming } = useMeetingsUpcoming()
  const { data: docs } = useDocuments({ limit: 5 })
  const { data: cqiSummary } = useCqiDepartmentsSummary()

  const summary = indicatorDash?.summary

  const statusPie = [
    { name: 'ผ่านเกณฑ์', value: summary?.passing ?? 0, color: CHART_COLORS.green },
    { name: 'เฝ้าระวัง', value: summary?.warning ?? 0, color: CHART_COLORS.gold },
    { name: 'ไม่ผ่าน', value: summary?.failing ?? 0, color: CHART_COLORS.rose },
  ].filter((d) => d.value > 0)

  const cqiBars = (cqiSummary ?? [])
    .map((d) => ({
      name: d.department.code || d.department.name,
      total: d.total,
      outstanding: d.outstanding,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  return (
    <div className={cn('flex flex-col gap-8 lg:gap-10')}>
      <AdminEditablePageHeader
        pageKey="home"
        title="แดชบอร์ด"
        description="ศูนย์ประสานงานคุณภาพ HA"
        descriptionPrefix={`สวัสดี ${user?.name ?? 'ผู้ใช้งาน'} — `}
      />

      <section className={cn('flex flex-col gap-5')}>
        <SectionHeader label="สรุปภาพรวม" title="ตัวชี้วัดและสถานะ" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="ตัวชี้วัดทั้งหมด"
            value={summary?.total ?? 0}
            icon={BarChart3}
            loading={indLoading}
            variant="primary"
          />
          <StatCard
            label="ผ่านเกณฑ์"
            value={summary?.passing ?? 0}
            loading={indLoading}
            variant="success"
          />
          <StatCard
            label="ไม่ผ่าน"
            value={summary?.failing ?? 0}
            loading={indLoading}
            variant="danger"
          />
          <StatCard
            label="เตือน"
            value={summary?.warning ?? 0}
            loading={indLoading}
            variant="warning"
          />
        </div>
      </section>

      <section className={cn('flex flex-col gap-5')}>
        <SectionHeader label="ภาพรวมเชิงกราฟ" title="สถานะคุณภาพ" />
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="สัดส่วนสถานะตัวชี้วัด"
            description="ผลการประเมินล่าสุดของตัวชี้วัดทั้งหมด"
            icon={PieIcon}
            empty={statusPie.length === 0}
          >
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {statusPie.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartCard>

          <ChartCard
            title="โครงการ CQI ตามหน่วยงาน"
            description="จำนวนโครงการและผลงานโดดเด่น (สูงสุด 8 หน่วยงาน)"
            icon={ClipboardCheck}
            empty={cqiBars.length === 0}
          >
            <BarChart data={cqiBars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
              <XAxis dataKey="name" tick={chartAxisTick} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={chartAxisTick} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="โครงการ" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="outstanding" name="โดดเด่น" fill={CHART_COLORS.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      </section>

      {/* <MenuCards /> */}

      <section className={cn('flex flex-col gap-5')}>
        <SectionHeader label="อัปเดตล่าสุด" title="กิจกรรมและเอกสาร" />
        <div className="grid gap-5 lg:grid-cols-2">
          <ContentPanel
            title={
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                การประชุม 7 วันข้างหน้า
              </span>
            }
            action={
              <Link
                href="/dashboard/meetings"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                ปฏิทินเต็ม
                <ChevronRight className="size-3.5" />
              </Link>
            }
          >
            <ul className="divide-y divide-border">
              {(Array.isArray(upcoming) ? upcoming : []).length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  ไม่มีการประชุมในช่วงนี้
                </li>
              )}
              {((Array.isArray(upcoming) ? upcoming : []) as MeetingListItem[]).slice(0, 5).map((m) => (
                  <li key={m.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/dashboard/meetings/${m.id}`}
                      className="font-medium leading-snug text-foreground hover:text-primary hover:underline"
                    >
                      {m.title}
                    </Link>
                    <MeetingScheduleTimestamp
                      startAt={m.startAt}
                      endAt={m.endAt}
                      className="w-full"
                    />
                    {m.room?.name && (
                      <p className="text-xs text-muted-foreground">{m.room.name}</p>
                    )}
                  </li>
                ))}
            </ul>
          </ContentPanel>

          <ContentPanel
            title={
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                เอกสาร HA ล่าสุด
              </span>
            }
            action={
              <Link
                href="/dashboard/documents"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                ดูทั้งหมด
                <ChevronRight className="size-3.5" />
              </Link>
            }
          >
            <ul className="divide-y divide-border">
              {(docs?.data ?? []).length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">ไม่มีเอกสาร</li>
              )}
              {((docs?.data ?? []) as HaDocumentItem[]).slice(0, 5).map((d) => (
                <li key={d.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                  <p className="font-medium leading-snug text-foreground">{d.title}</p>
                  <RecordTimestamp
                    iso={d.currentVersion?.createdAt ?? d.createdAt}
                    label="uploaded"
                    variant="inline"
                    showRelative
                  />
                </li>
              ))}
            </ul>
          </ContentPanel>
        </div>
      </section>
    </div>
  )
}
