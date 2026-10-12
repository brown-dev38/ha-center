'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Monitor,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/app/empty-state'
import {
  MeetingPresentationTimer,
  type TimerRunState,
} from '@/app/meetings/meeting-presentation-timer'
import { MeetingProjectorOverlay } from '@/app/meetings/meeting-projector-overlay'
import { MeetingSessionReadonlyBanner } from '@/app/meetings/meeting-session-readonly-banner'
import {
  useDeleteMeetingAgenda,
  useMeetingDetail,
  useSyncMeetingAgendas,
  useUpdateAgendaTimer,
  useUpdateMeeting,
  useUploadAgendaAttachment,
} from '@/hooks/use-meeting-rooms'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuthUser } from '@/app/common/use-auth'
import { getApiUrl } from '@/app/common/api-url'
import { meetingTypeLabel } from '@/app/meetings/meeting-detail'
import {
  agendaToEditorState,
  defaultAgendaSlots,
  formatSessionDate,
  formatSessionTimeRange,
  MEETING_TYPE_OPTIONS,
  stringifyAgendaDescription,
  type AgendaEditorState,
} from '@/app/meetings/meeting-session'
import type { MeetingAgendaItem } from '@/app/meetings/meeting-rooms-api'
import {
  canControlMeetingSession,
  isReadOnlyMeetingSession,
  meetingSessionRoleLabel,
} from '@/app/meetings/meeting-session-access'
import {
  publishMeetingSessionState,
  subscribeMeetingSessionState,
} from '@/app/meetings/meeting-session-sync'
import { FileTypeIcon } from '@/app/documents/file-type-icon'
import { openUploadToast } from '@/app/common/upload-progress-toast'
import { showErrorToast, showSuccessToast } from '@/app/common/toast-store'
import { cn } from '@/app/common/utils'
import { surfaceCardClass } from '@/app/common/ui/surface-card'

type LocalAgendaRow = {
  id: string | null
  orderNo: number
  state: AgendaEditorState
  attachmentFileName?: string | null
  attachmentPath?: string | null
  durationMinutes?: number
}

function buildRowsFromMeeting(agendas: MeetingAgendaItem[]): LocalAgendaRow[] {
  const sorted = [...agendas].sort((a, b) => a.orderNo - b.orderNo)
  if (sorted.length === 0) {
    return defaultAgendaSlots(3).map((state, i) => ({
      id: null,
      orderNo: i + 1,
      state,
    }))
  }
  return sorted.map((a) => ({
    id: a.id,
    orderNo: a.orderNo,
    state: agendaToEditorState(a, a.orderNo),
    attachmentFileName: a.attachmentFileName,
    attachmentPath: a.attachmentPath,
    durationMinutes: a.durationMinutes ?? undefined,
  }))
}

function rowsToBatch(rows: LocalAgendaRow[]) {
  return rows.map((r) => ({
    ...(r.id ? { id: r.id } : {}),
    title: r.state.title.trim() || `ระเบียบวาระที่ ${r.orderNo}`,
    orderNo: r.orderNo,
    durationMinutes: r.durationMinutes ?? 5,
    description: stringifyAgendaDescription({
      content: r.state.content,
      items: r.state.items,
    }),
  }))
}

export function MeetingSessionView() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const { canManageMeetingRooms } = usePermissions()
  const currentUserId = useAuthUser()?.id

  const { data: meeting, isLoading, isError, refetch } = useMeetingDetail(id)
  const updateMeeting = useUpdateMeeting()
  const syncAgendas = useSyncMeetingAgendas()
  const deleteAgenda = useDeleteMeetingAgenda()
  const uploadAttachment = useUploadAgendaAttachment()
  const updateTimer = useUpdateAgendaTimer()

  const [rows, setRows] = useState<LocalAgendaRow[]>([])
  const [meetingType, setMeetingType] = useState('general')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const [agendaIndex, setAgendaIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(5 * 60)
  const [initialSeconds, setInitialSeconds] = useState(5 * 60)
  const [runState, setRunState] = useState<TimerRunState>('idle')
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [projectorOpen, setProjectorOpen] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!meeting) return
    setRows(buildRowsFromMeeting(meeting.agendas))
    setMeetingType(meeting.type || 'general')
  }, [meeting?.id, meeting?.agendas, meeting?.type])

  const canControl = canControlMeetingSession(
    meeting,
    currentUserId,
    canManageMeetingRooms()
  )
  const isReadOnly = isReadOnlyMeetingSession(
    meeting,
    currentUserId,
    canManageMeetingRooms()
  )
  const sessionRole = meetingSessionRoleLabel(
    meeting,
    currentUserId,
    canManageMeetingRooms()
  )

  const currentRow = rows[agendaIndex]
  const currentOrderNo = currentRow?.orderNo ?? agendaIndex + 1

  const applyDurationForIndex = useCallback(
    (index: number) => {
      const row = rows[index]
      const mins = row?.durationMinutes ?? 5
      const sec = mins * 60
      setInitialSeconds(sec)
      setSecondsLeft(sec)
    },
    [rows]
  )

  useEffect(() => {
    applyDurationForIndex(agendaIndex)
    setRunState('idle')
  }, [agendaIndex, meeting?.id])

  useEffect(() => {
    if (runState !== 'running') {
      if (tickRef.current) clearInterval(tickRef.current)
      tickRef.current = null
      return
    }
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (autoAdvance && agendaIndex < rows.length - 1) {
            setAgendaIndex((i) => i + 1)
          } else {
            setRunState('idle')
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [runState, autoAdvance, agendaIndex, rows.length])

  useEffect(() => {
    if (!isReadOnly || !id) return
    const interval = setInterval(() => {
      void refetch()
    }, 5000)
    return () => clearInterval(interval)
  }, [isReadOnly, id, refetch])

  /** ผู้เข้าร่วมในแท็บอื่นเครื่องเดียวกัน — ติดตามวาระ/เวลาจากผู้ควบคุม */
  useEffect(() => {
    if (!isReadOnly || !id) return
    return subscribeMeetingSessionState(id, (payload) => {
      setAgendaIndex(payload.agendaIndex)
      setSecondsLeft(payload.secondsLeft)
      setInitialSeconds(payload.initialSeconds)
      setRunState(payload.runState)
    })
  }, [isReadOnly, id])

  useEffect(() => {
    if (!canControl || !meeting || !id) return
    const row = rows[agendaIndex]
    publishMeetingSessionState(id, {
      agendaIndex,
      currentOrderNo: row?.orderNo ?? agendaIndex + 1,
      secondsLeft,
      initialSeconds,
      runState,
      meetingTitle: meeting.title,
      agendaTitle: row?.state.title || `ระเบียบวาระที่ ${row?.orderNo ?? agendaIndex + 1}`,
      agendaContent: row?.state.content ?? '',
      updatedAt: Date.now(),
    })
  }, [
    canControl,
    id,
    meeting,
    rows,
    agendaIndex,
    secondsLeft,
    initialSeconds,
    runState,
  ])

  const openProjectorWindow = () => {
    const url = `/dashboard/meetings/${id}/session/projector`
    window.open(url, `meeting-projector-${id}`, 'noopener,width=1280,height=720')
  }

  const persistTimer = async (status: string, seconds: number) => {
    const agendaId = rows[agendaIndex]?.id
    if (!agendaId) return
    try {
      await updateTimer.mutateAsync({
        meetingId: id,
        agendaId,
        actualDurationSeconds: Math.max(0, initialSeconds - seconds),
        status,
      })
    } catch {
      /* non-blocking */
    }
  }

  const handleSaveMeetingType = async () => {
    if (!canControl) return
    try {
      await updateMeeting.mutateAsync({ meetingId: id, input: { type: meetingType } })
      showSuccessToast('บันทึกประเภทการประชุมแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    }
  }

  const handleSaveAgendas = async () => {
    if (!canControl) return
    setSaving(true)
    try {
      await syncAgendas.mutateAsync({ meetingId: id, agendas: rowsToBatch(rows) })
      await refetch()
      showSuccessToast('บันทึกวาระแล้ว')
      setEditMode(false)
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'บันทึกวาระไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleClearAllText = async () => {
    if (!canControl) return
    const ok = window.confirm('ลบข้อความในทุกวาระใช่หรือไม่?')
    if (!ok) return
    const cleared = rows.map((r) => ({
      ...r,
      state: {
        ...r.state,
        content: '',
        items: r.state.items.map((it) => ({ ...it, text: '' })),
      },
    }))
    setRows(cleared)
    setSaving(true)
    try {
      await syncAgendas.mutateAsync({ meetingId: id, agendas: rowsToBatch(cleared) })
      await refetch()
      showSuccessToast('ลบข้อความทั้งหมดแล้ว')
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'ลบข้อความไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const updateRowState = (orderNo: number, patch: Partial<AgendaEditorState>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.orderNo === orderNo ? { ...r, state: { ...r.state, ...patch } } : r
      )
    )
  }

  const handleDeleteRow = async (orderNo: number) => {
    const row = rows.find((r) => r.orderNo === orderNo)
    if (!row) return
    const ok = window.confirm(`ลบหัวข้อวาระที่ ${orderNo} ใช่หรือไม่?`)
    if (!ok) return
    if (row.id) {
      try {
        await deleteAgenda.mutateAsync({ meetingId: id, agendaId: row.id })
        await refetch()
        showSuccessToast('ลบวาระแล้ว')
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
      }
    } else {
      setRows((prev) => prev.filter((r) => r.orderNo !== orderNo))
    }
  }

  const handleAttach = (orderNo: number) => {
    const row = rows.find((r) => r.orderNo === orderNo)
    if (!row?.id) {
      showErrorToast('กรุณาบันทึกวาระก่อนแนบไฟล์')
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf,.pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const handle = openUploadToast({ fileName: file.name, fileSize: file.size })
      try {
        await uploadAttachment.mutateAsync({
          meetingId: id,
          agendaId: row.id!,
          file,
          onProgress: (percent, loaded) => handle.update(percent, loaded),
        })
        await refetch()
        handle.success('แนบไฟล์เรียบร้อย')
      } catch (e) {
        handle.error(e instanceof Error ? e.message : 'แนบไฟล์ไม่สำเร็จ')
      }
    }
    input.click()
  }

  const handleAddAgenda = () => {
    const next = rows.length > 0 ? Math.max(...rows.map((r) => r.orderNo)) + 1 : 1
    setRows((prev) => [
      ...prev,
      {
        id: null,
        orderNo: next,
        state: {
          title: `ระเบียบวาระที่ ${next}`,
          content: '',
          items: [
            { no: `${next}.1`, text: '' },
            { no: `${next}.2`, text: '' },
          ],
        },
      },
    ])
    setEditMode(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-16 text-sm text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        กำลังโหลดหน้าการประชุม...
      </div>
    )
  }

  if (isError || !meeting) {
    return (
      <EmptyState
        icon={Calendar}
        title="ไม่พบการประชุม"
        description="รายการอาจถูกลบหรือลิงก์ไม่ถูกต้อง"
      />
    )
  }

  const participantCount = meeting.participants?.length ?? 0
  const typeLabel =
    MEETING_TYPE_OPTIONS.find((o) => o.value === meetingType)?.label ??
    meetingTypeLabel(meeting.type)

  const syncPayload =
    meeting && currentRow
      ? {
          agendaIndex,
          currentOrderNo: currentRow.orderNo,
          secondsLeft,
          initialSeconds,
          runState,
          meetingTitle: meeting.title,
          agendaTitle:
            currentRow.state.title || `ระเบียบวาระที่ ${currentRow.orderNo}`,
          agendaContent: currentRow.state.content,
          updatedAt: Date.now(),
        }
      : null

  return (
    <div className={cn(cn('flex flex-col gap-8 lg:gap-10'), "print:space-y-4")}>
      {projectorOpen && syncPayload && (
        <MeetingProjectorOverlay
          meetingId={id}
          initial={syncPayload}
          onClose={() => setProjectorOpen(false)}
        />
      )}

      {/* Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/dashboard/meetings/${id}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
        >
          <ArrowLeft className="size-4" />
          กลับหน้าหลัก
        </Link>
        <div className="flex flex-wrap gap-2">
          {canControl && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (editMode) void handleSaveAgendas()
                  else setEditMode(true)
                }}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <Pencil className="size-4" />
                {editMode ? 'บันทึกข้อความ' : 'แก้ไขข้อความ'}
              </button>
              <button
                type="button"
                onClick={() => void handleClearAllText()}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50'
                )}
              >
                <Trash2 className="size-4" />
                ลบข้อความทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setProjectorOpen(true)}
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'gap-1.5 bg-slate-800 text-white hover:bg-slate-700'
                )}
              >
                <Monitor className="size-4" />
                โหมดโปรเจคเตอร์
              </button>
              <button
                type="button"
                onClick={openProjectorWindow}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <ExternalLink className="size-4" />
                เปิดจอโปรเจคเตอร์
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Printer className="size-4" />
            พิมพ์
          </button>
        </div>
      </header>

      <MeetingSessionReadonlyBanner role={sessionRole} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        {/* Main column */}
        <div className="space-y-6">
          <section className={cn(surfaceCardClass(), "overflow-hidden border-t-4 border-t-primary p-6 sm:p-8")}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              ระบบการประชุมผู้บริหาร
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {meeting.title}
            </h1>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <p>
                <span className="font-medium text-foreground">ห้องประชุม:</span>{' '}
                {meeting.room?.name ?? '—'}
                {meeting.room?.code ? ` (${meeting.room.code})` : ''}
              </p>
              <p>
                <span className="font-medium text-foreground">วันที่</span>{' '}
                {formatSessionDate(meeting.startAt)}
              </p>
              <p>
                <span className="font-medium text-foreground">เวลา</span>{' '}
                {formatSessionTimeRange(meeting.startAt, meeting.endAt)}
              </p>
              <p>
                <span className="font-medium text-foreground">ผู้เข้าร่วมประชุม:</span>{' '}
                {participantCount} คน
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="min-w-[200px] flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  ประเภทการประชุม
                </label>
                <p className="text-sm text-foreground/80">ปัจจุบัน: {typeLabel}</p>
                {canControl && (
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="mt-2 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {MEETING_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {canControl && (
                <button
                  type="button"
                  onClick={() => void handleSaveMeetingType()}
                  disabled={updateMeeting.isPending}
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'gap-1.5 shrink-0 bg-primary'
                  )}
                >
                  <Save className="size-4" />
                  บันทึก
                </button>
              )}
            </div>

            <p className="mt-4 text-sm">
              <span className="font-semibold text-foreground">ชื่อการประชุม:</span>{' '}
              {meeting.title}
            </p>
          </section>

          {/* Agenda cards */}
          <div className="space-y-4">
            {rows.map((row, rowIdx) => (
              <article
                key={`agenda-${row.orderNo}-${row.id ?? 'new'}`}
                className={cn(
                  cn(surfaceCardClass(), 'overflow-hidden rounded-xl border border-border/90 shadow-sm transition-shadow'),
                  rowIdx === agendaIndex &&
                    'ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
                  <h2 className="text-base font-bold text-primary">
                    {row.state.title || `ระเบียบวาระที่ ${row.orderNo}`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                    {row.attachmentFileName ? (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1">
                        <FileTypeIcon fileName={row.attachmentFileName} size="sm" />
                        <span className="max-w-[14rem] truncate text-xs font-medium text-foreground">
                          {row.attachmentFileName}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">ยังไม่มีไฟล์แนบ</span>
                    )}

                    {row.attachmentPath && (
                      <a
                        href={`${getApiUrl()}${row.attachmentPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'text-xs text-primary'
                        )}
                      >
                        {isReadOnly ? 'ดูไฟล์แนบ' : 'เปิดไฟล์'}
                      </a>
                    )}

                    {canControl && (
                      <button
                        type="button"
                        onClick={() => handleAttach(row.orderNo)}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'gap-1.5 text-xs'
                        )}
                      >
                        <Paperclip className="size-3.5" />
                        {row.attachmentFileName ? 'เปลี่ยนไฟล์' : 'แนบไฟล์ PDF'}
                      </button>
                    )}
                    {canControl && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteRow(row.orderNo)}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'gap-1 border-rose-200 text-rose-700 hover:bg-rose-50'
                        )}
                      >
                        <Trash2 className="size-3.5" />
                        ลบหัวข้อวาระนี้
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
                  {row.state.items.map((item, idx) => (
                    <div key={`${row.orderNo}-${item.no}-${idx}`} className="flex gap-2 text-sm">
                      <span className="w-10 shrink-0 font-medium text-muted-foreground">
                        {item.no}
                      </span>
                      {editMode && canControl ? (
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const items = [...row.state.items]
                            items[idx] = { ...items[idx], text: e.target.value }
                            updateRowState(row.orderNo, { items })
                          }}
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1"
                          placeholder="กรอกรายการย่อย..."
                        />
                      ) : (
                        <span className="flex-1 border-b border-dashed border-border/80 pb-0.5">
                          {item.text || '....................'}
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">เนื้อหาวาระ</p>
                    {editMode && canControl ? (
                      <textarea
                        value={row.state.content}
                        onChange={(e) =>
                          updateRowState(row.orderNo, { content: e.target.value })
                        }
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        placeholder="รายละเอียดวาระ..."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-foreground">
                        {row.state.content.trim() ? row.state.content : '—'}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {canControl && (
              <button
                type="button"
                onClick={handleAddAgenda}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full gap-2 border-dashed print:hidden'
                )}
              >
                <Plus className="size-4" />
                เพิ่มวาระ
              </button>
            )}
          </div>
        </div>

        {/* Timer sidebar */}
        <MeetingPresentationTimer
          currentOrderNo={currentOrderNo}
          totalAgendas={Math.max(rows.length, 1)}
          secondsLeft={secondsLeft}
          initialSeconds={initialSeconds}
          runState={runState}
          autoAdvance={autoAdvance}
          canControl={canControl}
          readOnly={isReadOnly}
          onAutoAdvanceChange={setAutoAdvance}
          onPreset={(min) => {
            const sec = min * 60
            setInitialSeconds(sec)
            setSecondsLeft(sec)
            setRunState('idle')
          }}
          onStart={() => setRunState('running')}
          onPause={() => setRunState('paused')}
          onEnd={() => {
            setRunState('idle')
            void persistTimer('completed', secondsLeft)
          }}
          onPrev={() => {
            setAgendaIndex((i) => Math.max(0, i - 1))
          }}
          onNext={() => {
            setAgendaIndex((i) => Math.min(rows.length - 1, i + 1))
          }}
          onReset={() => {
            setRunState('idle')
            applyDurationForIndex(agendaIndex)
          }}
        />
      </div>

      {saving && (
        <p className="fixed bottom-4 right-4 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg print:hidden">
          กำลังบันทึก...
        </p>
      )}
    </div>
  )
}
