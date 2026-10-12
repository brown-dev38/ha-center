'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  Leaf,
  Loader2,
  Search,
  Settings2,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HaLogo } from '@/app/brand/ha-logo'
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from '@/app/charts/chart-theme'
import { cn } from '@/app/common/utils'
import { PE_DEPARTMENTS } from '@/app/patient-experience/pe-config'
import { getPeDataset, PE_SEED_DATE_SPAN } from '@/app/patient-experience/pe-data'
import {
  formatThaiDateRangeLabel,
  PeDateRangeFilter,
  type PeDateRange,
} from '@/app/patient-experience/pe-date-range'
import { PeDepartmentTable } from '@/app/patient-experience/pe-department-table'
import { PeHeatmap } from '@/app/patient-experience/pe-heatmap'
import { PeKpiCards } from '@/app/patient-experience/pe-kpi-cards'
import { PePart2ScoresPanel } from '@/app/patient-experience/pe-part2-scores-panel'
import {
  filterCommentsByPart3Theme,
  PePart3ThemeCards,
  type PePart3ThemeFilter,
} from '@/app/patient-experience/pe-part3-theme-cards'
import { PeSurveyStructurePanels } from '@/app/patient-experience/pe-survey-structure-panels'
import type { PeDepartmentId } from '@/app/patient-experience/pe-types'
import {
  filterPeDataset,
  parsePeUploadFile,
  PE_UPLOAD_ACCEPT,
} from '@/app/patient-experience/pe-upload-parse'
import { downloadPeUploadTemplate } from '@/app/patient-experience/pe-upload-template'
import {
  clearPublishedArchive,
  fetchPeArchive,
  migrateLocalPeArchive,
  publishPeSlot,
  removePublishedSlot,
  type PeArchiveSnapshot,
} from '@/app/patient-experience/pe-archive-sync'
import {
  buildConfirmedBundle,
  bundlesForYearComparison,
  currentBuddhistYear,
  formatPeriodLabel,
  formatSlotLabel,
  formatThaiLongDate,
  inferMonthFromFileName,
  inferYearFromFileName,
  listArchiveSlots,
  loadPeYearArchive,
  localTodayIso,
  nextUploadVersion,
  savePeYearArchive,
  slotIdFor,
  THAI_MONTHS,
  type PeUploadScope,
  type PeYearArchive,
} from '@/app/patient-experience/pe-year-archive'
import {
  PE_PART3_SUGGESTIONS,
  PE_SURVEY_ORG,
  PE_SURVEY_TITLE,
  mergeDepartmentCatalog,
  resolveSurveyDepartmentLabel,
  summarizePart3Themes,
} from '@/app/patient-experience/pe-survey-form-content'
import {
  annotateCommentsWithThemes,
  buildPart2DimensionScores,
  buildPart3FromComments,
  emptyPart2Items,
  formatSatisfactionPercent,
  mergePart2AcrossDepartments,
  satisfactionPercent,
} from '@/app/patient-experience/pe-survey-analytics'
import {
  downloadPeSurveyBlankPdf,
  downloadPeSurveyFilledPdf,
} from '@/app/patient-experience/pe-survey-pdf'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'

const YOY_COLORS = ['#6d28d9', '#2563eb', '#0d9488', '#ea580c', '#db2777']

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(',')
    )
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function satColor(score: number): string {
  if (score >= 4.7) return '#16a34a'
  if (score >= 4.4) return '#eab308'
  if (score >= 4.0) return '#ea580c'
  return '#dc2626'
}

function dissatColor(pct: number): string {
  if (pct <= 4) return '#16a34a'
  if (pct <= 6) return '#eab308'
  if (pct <= 8) return '#ea580c'
  return '#dc2626'
}

export function PePageContent() {
  const [departmentId, setDepartmentId] = useState<PeDepartmentId>('all')
  const [dateRange, setDateRange] = useState<PeDateRange>({ from: '', to: '' })
  const [chartMode, setChartMode] = useState<'radar' | 'bar'>('bar')
  const [commentQuery, setCommentQuery] = useState('')
  const [part3ThemeFilter, setPart3ThemeFilter] = useState<PePart3ThemeFilter>('all')
  const [archive, setArchive] = useState<PeYearArchive>({})
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadScope, setUploadScope] = useState<PeUploadScope>('year')
  const [uploadYear, setUploadYear] = useState(() => currentBuddhistYear())
  const [uploadMonth, setUploadMonth] = useState(() => new Date().getMonth() + 1)
  const [manageOpen, setManageOpen] = useState(false)
  const [pdfExporting, setPdfExporting] = useState<'blank' | 'comments' | null>(null)
  const [archiveSync, setArchiveSync] = useState<'loading' | 'live' | 'offline'>('loading')
  const [archiveSyncedAt, setArchiveSyncedAt] = useState<Date | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const archiveSnapshotRef = useRef<PeArchiveSnapshot>({ revision: 0, archive: {} })
  const archiveSyncRef = useRef<'loading' | 'live' | 'offline'>('loading')
  const uploadingRef = useRef(false)

  const applySharedArchive = (snapshot: PeArchiveSnapshot, preferSlot?: string | null) => {
    archiveSnapshotRef.current = snapshot
    savePeYearArchive(snapshot.archive)
    setArchive(snapshot.archive)
    setSelectedSlot((current) => {
      if (preferSlot && snapshot.archive[preferSlot]) return preferSlot
      if (current && snapshot.archive[current]) return current
      return listArchiveSlots(snapshot.archive)[0] ?? null
    })
    archiveSyncRef.current = 'live'
    setArchiveSync('live')
    setArchiveSyncedAt(new Date())
  }

  useEffect(() => {
    let cancelled = false
    const local = loadPeYearArchive()
    if (Object.keys(local).length) {
      setArchive(local)
      setSelectedSlot(listArchiveSlots(local)[0] ?? null)
    }

    const pull = async () => {
      if (uploadingRef.current) return
      try {
        const remote = await fetchPeArchive()
        if (cancelled) return
        const snapshot = await migrateLocalPeArchive(local, remote)
        if (cancelled || uploadingRef.current) return
        if (snapshot.revision !== archiveSnapshotRef.current.revision || archiveSyncRef.current !== 'live') {
          applySharedArchive(snapshot)
        } else {
          setArchiveSync('live')
          setArchiveSyncedAt(new Date())
        }
      } catch {
        if (!cancelled) {
          archiveSyncRef.current = 'offline'
          setArchiveSync('offline')
        }
      }
    }

    void pull()
    const timer = window.setInterval(() => void pull(), 20000)
    const onFocus = () => void pull()
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const archiveSlots = useMemo(() => listArchiveSlots(archive), [archive])
  const hasArchive = archiveSlots.length > 0
  const activeBundle = selectedSlot != null ? archive[selectedSlot] ?? null : null

  const seedDataset = useMemo(
    () => getPeDataset(departmentId, dateRange),
    [departmentId, dateRange]
  )

  const dataset = useMemo(() => {
    const raw = !activeBundle
      ? seedDataset
      : filterPeDataset(activeBundle.dataset, departmentId, dateRange)

    const part2Items =
      raw.part2Items?.length && raw.part2Items.some((i) => i.avgScore > 0 || i.responseCount > 0)
        ? raw.part2Items
        : mergePart2AcrossDepartments(raw.departments).some((i) => i.avgScore > 0)
          ? mergePart2AcrossDepartments(raw.departments)
          : emptyPart2Items()

    const comments = annotateCommentsWithThemes(raw.comments)

    return {
      ...raw,
      comments,
      part2Items,
      part3Themes: buildPart3FromComments(comments),
      dimensions:
        raw.dimensions?.length && raw.part2Items?.length
          ? raw.dimensions
          : buildPart2DimensionScores(part2Items),
    }
  }, [activeBundle, seedDataset, departmentId, dateRange])

  const departmentOptions = useMemo(() => {
    if (!activeBundle) return PE_DEPARTMENTS
    const known = new Set(PE_DEPARTMENTS.map((d) => d.label))
    const extras: typeof PE_DEPARTMENTS = []
    for (const row of activeBundle.dataset.departments) {
      const label = resolveSurveyDepartmentLabel(row.label)
      if (known.has(label) || extras.some((d) => d.label === label)) continue
      extras.push({ id: row.id, label })
    }
    return [...PE_DEPARTMENTS, ...extras]
  }, [activeBundle])

  const opdOptions = useMemo(
    () => departmentOptions.filter((d) => d.id !== 'all' && d.group === 'opd'),
    [departmentOptions]
  )
  const ipdOptions = useMemo(
    () => departmentOptions.filter((d) => d.group === 'ipd'),
    [departmentOptions]
  )
  const otherDeptOptions = useMemo(
    () => departmentOptions.filter((d) => d.id !== 'all' && !d.group),
    [departmentOptions]
  )

  const heatmapRows = useMemo(() => {
    const source = activeBundle
      ? filterPeDataset(activeBundle.dataset, 'all', dateRange).departments
      : getPeDataset('all', dateRange).departments
    return mergeDepartmentCatalog(source)
  }, [activeBundle, dateRange])

  const uploadedDepartmentCount = useMemo(() => {
    if (!activeBundle) return null
    return new Set(
      activeBundle.dataset.departments
        .filter((row) => row.count > 0)
        .map((row) => resolveSurveyDepartmentLabel(row.label))
    ).size
  }, [activeBundle])

  const heatmapComments = useMemo(() => {
    if (activeBundle) {
      return filterPeDataset(activeBundle.dataset, 'all', dateRange).comments
    }
    return getPeDataset('all', dateRange).comments
  }, [activeBundle, dateRange])

  const yoyRows = useMemo(() => {
    return bundlesForYearComparison(archive).map((bundle) => {
      const scoped =
        departmentId === 'all' ? bundle.dataset : filterPeDataset(bundle.dataset, departmentId)
      const k = scoped.kpis
      return {
        year: String(bundle.yearBe),
        yearBe: bundle.yearBe,
        slotId: bundle.slotId ?? `Y${bundle.yearBe}`,
        respondents: k?.respondents ?? 0,
        satisfaction: satisfactionPercent(k?.avgSatisfaction ?? 0),
        returnRate: k?.returnRate ?? 0,
        recommendRate: k?.recommendRate ?? 0,
        dissatisfaction: k?.dissatisfactionRate ?? 0,
        fileName: bundle.fileName ?? '',
      }
    }).filter((row) => departmentId === 'all' || row.respondents > 0)
  }, [archive, departmentId])

  const scopeLabel =
    departmentOptions.find((d) => d.id === departmentId)?.label ?? 'ภาพรวมทั้งหมด'
  const focusedDepartment = departmentId !== 'all'
  const visibleDepartmentRows = focusedDepartment ? dataset.departments : heatmapRows
  const visibleDepartmentComments = focusedDepartment ? dataset.comments : heatmapComments
  const scopeHasData = !focusedDepartment || dataset.kpis.respondents > 0
  const focusedPart2Ranks = [...dataset.part2Items]
    .filter((item) => item.avgScore > 0)
    .sort((a, b) => b.avgScore - a.avgScore)

  const radarData = dataset.dimensions.map((d) => ({
    name: d.label,
    value: d.max === 5 ? Math.round((d.score / 5) * 1000) / 10 : d.score,
  }))

  const deptBarData = [...dataset.departments]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.avgSatisfaction - a.avgSatisfaction)
    .map((d) => ({
      name: d.label.length > 14 ? `${d.label.slice(0, 12)}…` : d.label,
      fullName: d.label,
      satisfaction: satisfactionPercent(d.avgSatisfaction),
      score: d.avgSatisfaction,
      dissatisfaction: d.dissatisfactionRate,
      count: d.count,
    }))

  const filteredComments = useMemo(() => {
    const byTheme = filterCommentsByPart3Theme(dataset.comments, part3ThemeFilter)
    const q = commentQuery.trim().toLowerCase()
    if (!q) return byTheme
    return byTheme.filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    )
  }, [dataset.comments, commentQuery, part3ThemeFilter])

  const part3ThemeSummary = useMemo(() => {
    const fromComments = summarizePart3Themes(dataset.comments)
    const commentTotal = fromComments.counts.reduce((s, n) => s + n, 0) + fromComments.other
    if (commentTotal > 0) return fromComments
    if (dataset.part3Themes?.length) {
      const counts = PE_PART3_SUGGESTIONS.map((_, i) => {
        const found = dataset.part3Themes.find((t) => t.themeIndex === i)
        return found?.count ?? 0
      })
      const other = dataset.part3Themes.find((t) => t.themeIndex === -1)?.count ?? 0
      return { counts, other }
    }
    return fromComments
  }, [dataset.part3Themes, dataset.comments])

  const yearLabel = activeBundle ? formatSlotLabel(activeBundle) : 'ตัวอย่าง'

  const handleExportPdfBlank = async () => {
    setPdfExporting('blank')
    try {
      await downloadPeSurveyBlankPdf()
      showSuccessToast('ส่งออกแบบฟอร์มว่าง PDF แล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ส่งออก PDF ไม่สำเร็จ')
    } finally {
      setPdfExporting(null)
    }
  }

  const handleExportPdfFilled = async () => {
    setPdfExporting('comments')
    try {
      await downloadPeSurveyFilledPdf(
        {
          ...dataset,
          comments: filteredComments.length ? filteredComments : dataset.comments,
        },
        {
          scopeLabel,
          yearLabel,
          includeCommentPages: true,
        }
      )
      showSuccessToast('ส่งออกรายงาน PDF พร้อมข้อมูลแล้ว')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'ส่งออก PDF ไม่สำเร็จ')
    } finally {
      setPdfExporting(null)
    }
  }

  const handleExport = () => {
    const yearTag = activeBundle ? `y${activeBundle.yearBe}` : 'seed'
    const rows: string[][] = [
      ['Patient Experience PEP Export', scopeLabel, yearTag, new Date().toISOString()],
      [],
      ['KPI', 'Value'],
      ['จำนวนผู้ตอบ', String(dataset.kpis.respondents)],
      ['% คะแนนพึงพอใจเฉลี่ย', formatSatisfactionPercent(dataset.kpis.avgSatisfaction)],
      ['สุขภาพผู้ป่วยโดยรวม', dataset.kpis.overallHealthLabel],
      ['% กลับมาใช้บริการ', String(dataset.kpis.returnRate)],
      ['% การบอกต่อ', String(dataset.kpis.recommendRate)],
      ['% ไม่พึงพอใจ', String(dataset.kpis.dissatisfactionRate)],
      [],
      ['หน่วยงาน', 'count', '% พึงพอใจ', '% กลับมาใช้', '% บอกต่อ', '% ไม่พึงพอใจ'],
      ...dataset.departments.map((d) => [
        d.label,
        String(d.count),
        formatSatisfactionPercent(d.avgSatisfaction),
        String(d.returnRate),
        String(d.recommendRate),
        String(d.dissatisfactionRate),
      ]),
      [],
      ['ความคิดเห็น'],
      ['หน่วยงาน', 'sentiment', 'ข้อความ'],
      ...dataset.comments.map((c) => [c.department, c.sentiment, c.text]),
    ]

    if (yoyRows.length >= 2) {
      rows.push(
        [],
        ['เปรียบเทียบรายปี (พ.ศ.)'],
        ['ปี', 'ผู้ตอบ', '% พึงพอใจ', '%กลับมาใช้', '%บอกต่อ', '%ไม่พึงพอใจ', 'ไฟล์'],
        ...yoyRows.map((r) => [
          r.year,
          String(r.respondents),
          String(r.satisfaction),
          String(r.returnRate),
          String(r.recommendRate),
          String(r.dissatisfaction),
          r.fileName,
        ])
      )
    }

    downloadCsv(`pe-opd-${yearTag}-${departmentId}-${Date.now()}.csv`, rows)
  }

  const stageUpload = (file: File | undefined) => {
    if (!file) return
    const yearBe = inferYearFromFileName(file.name) ?? currentBuddhistYear()
    const month = inferMonthFromFileName(file.name)
    setPendingFile(file)
    setUploadYear(yearBe)
    setUploadMonth(month ?? new Date().getMonth() + 1)
    setUploadScope(month ? 'month' : 'year')
  }

  const cancelPendingUpload = () => {
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConfirmUpload = async () => {
    if (!pendingFile) return
    const receiptBase = {
      scope: uploadScope,
      yearBe: uploadYear,
      month: uploadScope === 'month' ? uploadMonth : null,
    }
    const receipt = {
      ...receiptBase,
      version: nextUploadVersion(archive, slotIdFor(receiptBase)),
      uploadedOn: localTodayIso(),
    }
    setUploading(true)
    uploadingRef.current = true
    try {
      const result = await parsePeUploadFile(pendingFile)
      const built = buildConfirmedBundle(result.bundles, receipt)
      const snapshot = await publishPeSlot(archiveSnapshotRef.current, built.bundle)
      applySharedArchive(snapshot, built.slotId)
      setUploadWarnings(result.warnings)
      setDepartmentId('all')
      setPendingFile(null)
      const scoredDepts = result.bundles.reduce(
        (sum, bundle) => sum + bundle.dataset.departments.filter((row) => row.count > 0).length,
        0
      )
      const stamp = `${formatPeriodLabel(receipt)} · เวอร์ชัน ${receipt.version} · ${formatThaiLongDate(receipt.uploadedOn)}`
      showSuccessToast(
        scoredDepts <= 1
          ? `บันทึกขึ้นเซิร์ฟเวอร์แล้ว ${stamp} แต่พบคะแนนเพียง ${scoredDepts} หน่วยงาน — ตรวจคอลัมน์หน่วยงานในไฟล์`
          : `บันทึกขึ้นเซิร์ฟเวอร์แล้ว ${stamp} · คิดคะแนนได้ ${scoredDepts} หน่วยงาน`
      )
    } catch (error) {
      archiveSyncRef.current = 'offline'
      setArchiveSync('offline')
      showErrorToast(error instanceof Error ? error.message : 'อัปโหลดไฟล์ไม่สำเร็จ')
    } finally {
      uploadingRef.current = false
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearSlot = async (slotId: string) => {
    const label = archive[slotId] ? formatSlotLabel(archive[slotId]) : slotId
    uploadingRef.current = true
    try {
      const snapshot = await removePublishedSlot(archiveSnapshotRef.current, slotId)
      applySharedArchive(snapshot)
      setDepartmentId('all')
      if (!Object.keys(snapshot.archive).length) setUploadWarnings([])
      showSuccessToast(`ลบข้อมูล ${label} แล้ว`)
    } catch (error) {
      archiveSyncRef.current = 'offline'
      setArchiveSync('offline')
      showErrorToast(error instanceof Error ? error.message : 'ลบข้อมูลไม่สำเร็จ')
    } finally {
      uploadingRef.current = false
    }
  }

  const clearAllArchive = async () => {
    uploadingRef.current = true
    try {
      const snapshot = await clearPublishedArchive(archiveSnapshotRef.current)
      applySharedArchive(snapshot)
      setUploadWarnings([])
      setDepartmentId('all')
      showSuccessToast('ล้างคลังบนเซิร์ฟเวอร์แล้ว กลับไปใช้ข้อมูลตัวอย่าง')
    } catch (error) {
      archiveSyncRef.current = 'offline'
      setArchiveSync('offline')
      showErrorToast(error instanceof Error ? error.message : 'ล้างข้อมูลไม่สำเร็จ')
    } finally {
      uploadingRef.current = false
    }
  }

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.22)]">
      <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-r border-slate-200 bg-[#f8fafc] lg:w-[17.5rem]">
          <div className="border-b border-slate-200 bg-white px-4 py-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-[#6d28d9] text-white shadow-sm">
                <Leaf className="size-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold leading-snug text-slate-900">
                  Patient Experience <span className="text-[#2563eb]">[PEP]</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {formatThaiDateRangeLabel(dataset.dateFrom, dataset.dateTo)}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      dataset.realtime ? 'bg-emerald-500' : hasArchive ? 'bg-violet-500' : 'bg-sky-500'
                    )}
                    aria-hidden
                  />
                  {activeBundle ? formatSlotLabel(activeBundle) : dataset.sourceLabel}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-1.5 border-violet-200 bg-violet-50 text-[#6d28d9] hover:bg-violet-100"
              onClick={() => setManageOpen(true)}
            >
              <Settings2 className="size-3.5" />
              จัดการข้อมูล
              {hasArchive ? (
                <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {archiveSlots.length} ชุด
                </span>
              ) : null}
            </Button>
          </div>

          <div className="space-y-4 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              ตัวกรองข้อมูล (Filter)
            </p>

            {hasArchive && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">เลือกชุดข้อมูล:</Label>
                <select
                  value={selectedSlot ?? ''}
                  onChange={(e) => {
                    setSelectedSlot(e.target.value || null)
                    setDepartmentId('all')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
                >
                  {archiveSlots.map((slotId) => {
                    const bundle = archive[slotId]
                    if (!bundle) return null
                    const version = bundle.period?.version
                    return (
                      <option key={`slot-${slotId}`} value={slotId}>
                        {formatSlotLabel(bundle)}
                        {version ? ` · v${version}` : ''}
                        {` · ${bundle.dataset.kpis.respondents.toLocaleString()} คน`}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">เลือกหน่วยงาน:</Label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value as PeDepartmentId)}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm font-medium outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20 ${
                  focusedDepartment
                    ? 'border-[#6d28d9] ring-2 ring-[#6d28d9]/15'
                    : 'border-slate-200'
                }`}
              >
                <option value="all">ภาพรวมทั้งหมด</option>
                {opdOptions.length > 0 && (
                  <optgroup label="งานผู้ป่วยนอก">
                    {opdOptions.map((d) => (
                      <option key={`dept-opt-${d.id}`} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                {ipdOptions.length > 0 && (
                  <optgroup label="งานผู้ป่วยใน">
                    {ipdOptions.map((d) => (
                      <option key={`dept-opt-${d.id}`} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherDeptOptions.length > 0 && (
                  <optgroup label="หน่วยงานอื่น">
                    {otherDeptOptions.map((d) => (
                      <option key={`dept-opt-${d.id}`} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {focusedDepartment ? (
                <p className="text-[11px] leading-snug text-[#6d28d9]">
                  ทั้งหน้านี้แสดงเฉพาะ {scopeLabel}
                </p>
              ) : null}
            </div>
            <PeDateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              dataMin={hasArchive ? undefined : PE_SEED_DATE_SPAN.from}
              dataMax={hasArchive ? undefined : PE_SEED_DATE_SPAN.to}
            />

            <Button type="button" className="w-full gap-2" onClick={handleExport}>
              <Download className="size-3.5" />
              Export CSV report
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={pdfExporting != null}
              onClick={() => void handleExportPdfBlank()}
            >
              {pdfExporting === 'blank' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              PDF แบบฟอร์มว่าง
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={pdfExporting != null || dataset.kpis.respondents === 0}
              onClick={() => void handleExportPdfFilled()}
            >
              {pdfExporting === 'comments' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              PDF รายงาน (เติมข้อมูล)
            </Button>
          </div>

            <div className="mt-auto space-y-2 border-t border-slate-200 bg-white p-4 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">เกณฑ์คะแนนส่วนที่ 2</p>
            <p>0 = ไม่ได้ใช้บริการ</p>
            <p>1 น้อยที่สุด · 2 น้อย · 3 ปานกลาง · 4 มาก · 5 มากที่สุด</p>
            <p className="pt-1 font-semibold text-slate-700">เกณฑ์สี (คะแนนเฉลี่ย)</p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#16a34a]" /> ≥ 4.70 ดีมาก
            </p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#eab308]" /> 4.40–4.69 ปานกลาง
            </p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#ea580c]" /> 4.00–4.39 เฝ้าระวัง
            </p>
            <p>
              <span className="mr-1 inline-block size-2 rounded-sm bg-[#dc2626]" /> &lt; 4.00 ต้องพัฒนา
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <span className="hidden h-6 w-1 rounded-full bg-[#6d28d9] sm:block" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-slate-500">{PE_SURVEY_ORG}</p>
                <p className="font-heading text-sm font-bold text-slate-900">
                  {PE_SURVEY_TITLE} · PEP Dashboard
                </p>
              </div>
            </div>
            <HaLogo size="sm" className="shrink-0 opacity-90" />
          </header>

          <div className="space-y-6 bg-[#f8fafc] p-4 lg:p-6">
            {uploadWarnings.length > 0 && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm text-violet-950">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
                  รายงานการจับคู่คอลัมน์จากไฟล์อัปโหลด
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-violet-900/90">
                  {uploadWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
                {scopeLabel}
                {activeBundle ? (
                  <span className="ml-2 text-base font-semibold text-[#6d28d9]">
                    · {formatSlotLabel(activeBundle)}
                  </span>
                ) : null}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {PE_SURVEY_TITLE} · {dataset.sourceLabel}
                {focusedDepartment ? ` · ผู้ตอบ ${dataset.kpis.respondents.toLocaleString('th-TH')} คน` : ''}
              </p>
            </div>

            {focusedDepartment ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d28d9]">
                    ขอบเขตที่เลือก
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{scopeLabel}</p>
                  <p className="text-xs text-slate-500">
                    {scopeHasData
                      ? `คะแนน ความคิดเห็น และกราฟด้านล่างคำนวณจากหน่วยงานนี้เท่านั้น`
                      : 'ไม่พบผู้ตอบของหน่วยงานนี้ในชุดข้อมูลที่เลือก'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setDepartmentId('all')}
                >
                  ดูภาพรวมทั้งหมด
                </Button>
              </div>
            ) : null}

            {scopeHasData ? (
            <>
            <PeKpiCards kpis={dataset.kpis} />

            <PeSurveyStructurePanels
              demographics={dataset.demographics}
              part3Themes={dataset.part3Themes}
              part1Note={
                focusedDepartment
                  ? 'ส่วนที่ 1 ในไฟล์สรุปผู้ตอบทั้งชุด จึงแสดงเมื่อเลือกภาพรวมทั้งหมดเท่านั้น'
                  : undefined
              }
            />

            <PePart2ScoresPanel items={dataset.part2Items} />

            {yoyRows.length >= 2 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 font-heading text-base font-bold text-slate-900">
                    <GitCompareArrows className="size-4 text-[#6d28d9]" />
                    เปรียบเทียบรายปี (Year-over-Year)
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {focusedDepartment
                      ? `แนวโน้มของ ${scopeLabel} · ${yoyRows.length} ปี`
                      : `แนวโน้ม KPI จากคลังข้อมูลที่อัปโหลด · ${yoyRows.length} ปี`}
                  </p>
                </div>

                <div className="mb-5 overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">ปี พ.ศ.</th>
                        <th className="px-3 py-2.5 font-semibold">ผู้ตอบ</th>
                        <th className="px-3 py-2.5 font-semibold">% พึงพอใจ</th>
                        <th className="px-3 py-2.5 font-semibold">% กลับมาใช้</th>
                        <th className="px-3 py-2.5 font-semibold">% บอกต่อ</th>
                        <th className="px-3 py-2.5 font-semibold">% ไม่พึงพอใจ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yoyRows.map((r, i) => {
                        const prev = i > 0 ? yoyRows[i - 1] : null
                        const delta = prev ? r.satisfaction - prev.satisfaction : null
                        return (
                          <tr
                            key={r.year}
                            className={cn(
                              'border-t border-slate-100',
                              activeBundle?.yearBe === r.yearBe && 'bg-violet-50/60'
                            )}
                          >
                            <td className="px-3 py-2.5 font-semibold tabular-nums text-slate-800">
                              {r.year}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-slate-700">
                              {r.respondents.toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums font-medium text-slate-800">
                              {r.satisfaction.toFixed(1)}%
                              {delta != null && (
                                <span
                                  className={cn(
                                    'ml-1.5 text-[10px] font-bold',
                                    delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                  )}
                                >
                                  {delta >= 0 ? '▲' : '▼'}
                                  {Math.abs(delta).toFixed(1)}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-slate-700">
                              {r.returnRate.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-slate-700">
                              {r.recommendRate.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2.5 tabular-nums text-slate-700">
                              {r.dissatisfaction.toFixed(1)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-[260px] w-full">
                    <p className="mb-2 text-xs font-semibold text-slate-600">คะแนนพึงพอใจเฉลี่ย</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={yoyRows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                        <Tooltip formatter={(value: number) => [`${Number(value).toFixed(1)}%`, '% พึงพอใจ']} />
                        <Line
                          type="monotone"
                          dataKey="satisfaction"
                          name="% พึงพอใจ"
                          stroke={YOY_COLORS[0]}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[260px] w-full">
                    <p className="mb-2 text-xs font-semibold text-slate-600">อัตรา % หลัก</p>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={yoyRows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="returnRate"
                          name="% กลับมาใช้"
                          stroke={YOY_COLORS[1]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="recommendRate"
                          name="% บอกต่อ"
                          stroke={YOY_COLORS[2]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="dissatisfaction"
                          name="% ไม่พึงพอใจ"
                          stroke={YOY_COLORS[3]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    มิติส่วนที่ 2 ตามกลุ่มหัวข้อ
                  </h3>
                  <p className="text-sm text-slate-500">
                    แพทย์ · พยาบาล/เจ้าหน้าที่ · มีส่วนร่วม · ข้อมูล · องค์รวม · โดยรวม (ฐาน 100)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={chartMode === 'bar' ? 'default' : 'outline'}
                    onClick={() => setChartMode('bar')}
                  >
                    Bar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={chartMode === 'radar' ? 'default' : 'outline'}
                    onClick={() => setChartMode('radar')}
                  >
                    Radar
                  </Button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'radar' ? (
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={CHART_GRID_COLOR} />
                      <PolarAngleAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#6d28d9"
                        fill="#6d28d9"
                        fillOpacity={0.25}
                        name="คะแนน"
                      />
                      <Tooltip />
                    </RadarChart>
                  ) : (
                    <BarChart data={radarData} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                      <CartesianGrid
                        stroke={CHART_GRID_COLOR}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        name="คะแนน (ปรับฐาน 100)"
                        radius={[8, 8, 0, 0]}
                        fill="#6d28d9"
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </section>

            {focusedDepartment ? null : (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
              <h3 className="mb-1 font-heading text-base font-bold text-slate-900">
                เปรียบเทียบคะแนนพึงพอใจตามหน่วยงาน
              </h3>
              <p className="mb-4 text-sm text-slate-500">แท่งสีตามเกณฑ์ความเสี่ยง</p>
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptBarData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke={CHART_GRID_COLOR}
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toFixed(1)}%`, '% พึงพอใจ']}
                      labelFormatter={(_, payload) =>
                        (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName ??
                        ''
                      }
                    />
                    <Bar dataKey="satisfaction" name="% พึงพอใจ" radius={[0, 6, 6, 0]}>
                      {deptBarData.map((d) => (
                        <Cell key={d.fullName} fill={satColor(d.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            )}

            {uploadedDepartmentCount === 1 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                คะแนนที่บันทึกไว้ถูกรวมไว้ที่หน่วยงานเดียว จึงยังคิดคะแนนหน่วยงานอื่นไม่ได้
                อัปโหลดไฟล์เดิมอีกครั้ง ระบบจะคิดคะแนนจากทุกช่องที่ติ๊กในข้อ
                “ครั้งนี้ท่านเข้ารับบริการแบบใด”
              </p>
            ) : null}

            <PeHeatmap
              rows={visibleDepartmentRows}
              comments={visibleDepartmentComments}
              selectedId={departmentId}
              onSelectDepartment={(id) => setDepartmentId(id)}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <RankCard
                title={focusedDepartment ? 'ข้อที่ได้คะแนนสูงสุดในหน่วยงานนี้' : 'จุดแข็ง Top 5 (ส่วนที่ 2)'}
                icon={TrendingUp}
                tone="green"
                items={
                  focusedDepartment
                    ? focusedPart2Ranks.slice(0, 5).map((item) => ({
                        label: `${item.questionNo}. ${item.shortLabel}`,
                        sub: 'คะแนนส่วนที่ 2',
                        value: item.avgScore.toFixed(2),
                      }))
                    : dataset.topStrengths.map((i) => ({
                        label: i.label,
                        sub: i.metric,
                        value: i.unit === 'score' ? i.value.toFixed(2) : `${i.value.toFixed(1)}%`,
                      }))
                }
              />
              <RankCard
                title={focusedDepartment ? 'ข้อที่ควรพัฒนาในหน่วยงานนี้' : 'จุดที่ควรพัฒนา Top 5'}
                icon={TrendingDown}
                tone="red"
                items={
                  focusedDepartment
                    ? [...focusedPart2Ranks].reverse().slice(0, 5).map((item) => ({
                        label: `${item.questionNo}. ${item.shortLabel}`,
                        sub: 'คะแนนส่วนที่ 2',
                        value: item.avgScore.toFixed(2),
                      }))
                    : dataset.topImprovements.map((i) => ({
                        label: i.label,
                        sub: i.metric,
                        value: i.unit === 'score' ? i.value.toFixed(2) : `${i.value.toFixed(1)}%`,
                      }))
                }
              />
            </div>

            <PeDepartmentTable
              rows={visibleDepartmentRows}
              comments={visibleDepartmentComments}
              selectedId={departmentId}
              onSelectDepartment={(id) => setDepartmentId(id)}
            />

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    ส่วนที่ 3 ข้อเสนอแนะ — ความคิดเห็นผู้ป่วย
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    สัดส่วนความคิดเห็นตาม 5 ด้าน · {dataset.comments.length.toLocaleString('th-TH')} รายการ
                    {part3ThemeFilter !== 'all' ? ' (กรองตามด้านที่เลือก)' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {part3ThemeFilter !== 'all' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[12px] text-slate-500"
                      onClick={() => setPart3ThemeFilter('all')}
                    >
                      ล้างตัวกรองด้าน
                    </Button>
                  ) : null}
                  <div className="relative w-full max-w-xs sm:w-56">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={commentQuery}
                      onChange={(e) => setCommentQuery(e.target.value)}
                      placeholder="ค้นหาความคิดเห็น / หน่วยงาน..."
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={pdfExporting != null || dataset.kpis.respondents === 0}
                    onClick={() => void handleExportPdfFilled()}
                  >
                    {pdfExporting === 'comments' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                    Export PDF (เติมข้อมูล)
                  </Button>
                </div>
              </div>

              <PePart3ThemeCards
                comments={dataset.comments}
                counts={part3ThemeSummary.counts}
                otherCount={part3ThemeSummary.other}
                selectedTheme={part3ThemeFilter}
                onSelectTheme={setPart3ThemeFilter}
              />

              <div className="max-h-[22rem] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-44">หน่วยงาน</TableHead>
                      <TableHead className="w-28">Sentiment</TableHead>
                      <TableHead>ข้อความ (ส่วนที่ 3)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-slate-400">
                          ไม่พบความคิดเห็น
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredComments.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm text-slate-700">{c.department}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                c.sentiment === 'positive' && 'bg-emerald-50 text-emerald-700',
                                c.sentiment === 'neutral' && 'bg-slate-100 text-slate-600',
                                c.sentiment === 'negative' && 'bg-rose-50 text-rose-700'
                              )}
                            >
                              {c.sentiment}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-800">{c.text}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
            </>
            ) : (
              <section className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
                <p className="font-heading text-base font-bold text-slate-900">
                  ไม่มีข้อมูลของ {scopeLabel}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  ชุดข้อมูลที่เลือกไม่มีผู้ตอบที่ระบุหน่วยงานนี้ เลือกหน่วยงานอื่นจากแถบซ้าย
                  หรือกลับไปดูภาพรวมทั้งหมด
                </p>
              </section>
            )}

            <p className="text-center text-[11px] text-slate-400">
              {hasArchive
                ? `คลังข้อมูล · ${archiveSlots.length} ชุด · ${activeBundle ? formatSlotLabel(activeBundle) : '—'}`
                : `ข้อมูลตัวอย่างสำหรับสาธิตระบบ · ${formatThaiDateRangeLabel(dataset.dateFrom, dataset.dateTo)}`}
            </p>
          </div>
        </div>
      </div>
    </div>

    <Dialog
      open={manageOpen}
      onOpenChange={(open) => {
        setManageOpen(open)
        if (!open && !uploading) cancelPendingUpload()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>จัดการข้อมูล Patient Experience [PEP]</DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์สำรวจตามแบบประเมินรับฟังความคิดเห็นผู้ป่วย ระบบจะจับคู่หัวคอลัมน์กับส่วนที่ 1–3
            แล้วเก็บเป็นคลังร่วมบนเซิร์ฟเวอร์ ทุกเครื่องที่เข้าสู่ระบบจะเห็นชุดข้อมูลเดียวกัน
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6d28d9]">
              อัปโหลดข้อมูล
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
              รองรับ <span className="font-semibold">.xls / .xlsx / .csv</span> — จับคู่หัวข้ออัตโนมัติ
              เช่น <code className="rounded bg-white px-1 text-[11px]">part2_1…part2_16</code>,{' '}
              <code className="rounded bg-white px-1 text-[11px]">part2_17</code>,{' '}
              <code className="rounded bg-white px-1 text-[11px]">part3_1…5</code>, หน่วยงาน, เพศ, อายุ
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={PE_UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => stageUpload(e.target.files?.[0])}
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="w-full gap-2 sm:flex-1"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {uploading ? 'กำลังอ่านไฟล์...' : 'อัปโหลด Excel / CSV'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={() => downloadPeUploadTemplate()}
              >
                <FileSpreadsheet className="size-3.5" />
                ดาวน์โหลดเทมเพลต
              </Button>
            </div>
            {pendingFile ? (
              <UploadConfirmPanel
                fileName={pendingFile.name}
                scope={uploadScope}
                yearBe={uploadYear}
                month={uploadMonth}
                version={nextUploadVersion(
                  archive,
                  slotIdFor({
                    scope: uploadScope,
                    yearBe: uploadYear,
                    month: uploadScope === 'month' ? uploadMonth : null,
                  })
                )}
                replacing={Boolean(
                  archive[
                    slotIdFor({
                      scope: uploadScope,
                      yearBe: uploadYear,
                      month: uploadScope === 'month' ? uploadMonth : null,
                    })
                  ]
                )}
                previousVersion={
                  archive[
                    slotIdFor({
                      scope: uploadScope,
                      yearBe: uploadYear,
                      month: uploadScope === 'month' ? uploadMonth : null,
                    })
                  ]?.period?.version
                }
                uploading={uploading}
                yearChoices={uploadYearChoices(archive, uploadYear)}
                onScopeChange={setUploadScope}
                onYearChange={setUploadYear}
                onMonthChange={setUploadMonth}
                onCancel={cancelPendingUpload}
                onConfirm={() => void handleConfirmUpload()}
              />
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">คลังข้อมูลรายปี</p>
              <p className="text-[11px] text-slate-400">
                {archiveSync === 'loading'
                  ? 'กำลังเชื่อมคลังกลาง...'
                  : archiveSync === 'live'
                    ? `คลังกลาง${archiveSyncedAt ? ` · ${archiveSyncedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}` : ''}`
                    : 'เชื่อมคลังกลางไม่ได้ — เครื่องอื่นจะยังไม่เห็นข้อมูล'}
              </p>
            </div>
            {archiveSlots.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                ยังไม่มีข้อมูลอัปโหลด — ใช้ข้อมูลตัวอย่างจนกว่าจะอัปไฟล์
              </p>
            ) : (
              <div className="max-h-[18rem] space-y-2 overflow-auto pr-0.5">
                {archiveSlots.map((slotId) => {
                  const b = archive[slotId]
                  if (!b) return null
                  const version = b.period?.version
                  const uploadedOn = b.period?.uploadedOn || b.uploadedAt
                  return (
                    <div
                      key={`arch-${slotId}`}
                      className={cn(
                        'rounded-lg border px-3 py-2.5',
                        selectedSlot === slotId
                          ? 'border-violet-300 bg-violet-50/70'
                          : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-[#6d28d9]" />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            setSelectedSlot(slotId)
                            setDepartmentId('all')
                            setManageOpen(false)
                          }}
                        >
                          <p className="text-sm font-semibold text-slate-800">{formatSlotLabel(b)}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-[#6d28d9]">
                            {version ? `เวอร์ชัน ${version}` : 'เวอร์ชัน 1'}
                            {' · '}
                            {formatThaiLongDate(uploadedOn)}
                          </p>
                          <p className="mt-0.5 break-all text-[11px] text-slate-500">{b.fileName}</p>
                          <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                            {b.dataset.kpis.respondents.toLocaleString()} คน · พึงพอใจ{' '}
                            {formatSatisfactionPercent(b.dataset.kpis.avgSatisfaction)}
                          </p>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 gap-1 text-xs text-rose-600 hover:text-rose-700"
                          onClick={() => void clearSlot(slotId)}
                        >
                          <Trash2 className="size-3" />
                          ลบ
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {hasArchive ? (
            <Button type="button" variant="ghost" className="text-slate-600" onClick={() => void clearAllArchive()}>
              ล้างทั้งหมด / ใช้ข้อมูลตัวอย่าง
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" variant="outline" onClick={() => setManageOpen(false)}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

function uploadYearChoices(archive: PeYearArchive, selected: number): number[] {
  const now = currentBuddhistYear()
  const years = new Set<number>([now - 1, now, now + 1, selected])
  for (const bundle of Object.values(archive)) years.add(bundle.yearBe)
  return [...years].filter((year) => year >= 2500 && year <= 2700).sort((a, b) => b - a)
}

function UploadConfirmPanel({
  fileName,
  scope,
  yearBe,
  month,
  version,
  replacing,
  previousVersion,
  uploading,
  yearChoices,
  onScopeChange,
  onYearChange,
  onMonthChange,
  onCancel,
  onConfirm,
}: {
  fileName: string
  scope: PeUploadScope
  yearBe: number
  month: number
  version: number
  replacing: boolean
  previousVersion?: number
  uploading: boolean
  yearChoices: number[]
  onScopeChange: (scope: PeUploadScope) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const receipt = {
    scope,
    yearBe,
    month: scope === 'month' ? month : null,
  }
  const uploadedOn = localTodayIso()

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        ยืนยันก่อนบันทึก
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900" title={fileName}>
        {fileName}
      </p>
      <p className="mt-0.5 text-[12px] text-slate-500">
        เลือกช่วงของข้อมูลชุดนี้ ระบบจะยังไม่บันทึกจนกว่าจะกดยืนยัน
      </p>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            ['month', 'รายเดือน'],
            ['year', 'รายปี'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={cn(
              'h-9 rounded-md text-sm font-semibold transition-colors',
              scope === value
                ? 'bg-white text-[#6d28d9] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            )}
            onClick={() => onScopeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={cn('mt-3 grid gap-3', scope === 'month' ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {scope === 'month' ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">เดือน</span>
            <select
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
            >
              {THAI_MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-600">ปี พ.ศ.</span>
          <select
            value={yearBe}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-[#6d28d9]/20"
          >
            {yearChoices.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-xs text-slate-500">ช่วงข้อมูล</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatPeriodLabel(receipt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-xs text-slate-500">เวอร์ชันที่จะบันทึก</dt>
          <dd className="text-sm font-semibold tabular-nums text-[#6d28d9]">เวอร์ชัน {version}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <dt className="text-xs text-slate-500">วันที่อัปโหลด</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatThaiLongDate(uploadedOn)}</dd>
        </div>
      </dl>

      {replacing ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
          ช่วงนี้มีเวอร์ชัน {previousVersion ?? 1} อยู่แล้ว การยืนยันจะแทนที่ด้วยเวอร์ชัน {version}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={uploading} onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="button" disabled={uploading} onClick={onConfirm}>
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {uploading ? 'กำลังบันทึก...' : 'ยืนยันอัปโหลด'}
        </Button>
      </div>
    </div>
  )
}

function RankCard({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string
  icon: typeof TrendingUp
  tone: 'green' | 'red'
  items: Array<{ label: string; sub: string; value: string }>
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn('size-4', tone === 'green' ? 'text-emerald-600' : 'text-rose-600')} />
        <h3 className="font-heading text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-[11px] text-slate-500">{item.sub}</p>
            </div>
            <p
              className={cn(
                'text-sm font-bold tabular-nums',
                tone === 'green' ? 'text-emerald-700' : 'text-rose-700'
              )}
            >
              {item.value}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
